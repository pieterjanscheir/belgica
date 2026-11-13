# Changelog

All notable changes to this package. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow the
[id rules](https://pieterjanscheir.github.io/belgica/guide/identifiers): adding data is a
minor version, fixing a value a patch, removing or renaming an id a major version.

## [Unreleased]

### Added

- The documentation has a [court finder](https://pieterjanscheir.github.io/belgica/guide/court-finder),
  in English, Dutch and French: an address (geocoded by the region's register) or a point clicked
  on the map, placed in the canton boundaries, and every court with jurisdiction there as a card
  with its address and registry contacts, the law's text where the point is within 25 m of
  another canton, and the calls that gave the result. The map (MapLibre on OpenFreeMap's tiles)
  tints every canton in one of six colours, never a neighbour's, draws the boundaries at full
  precision over the buildings and house numbers when zoomed in, and marks the justices of the
  peace. `pnpm build:docs-map` writes what it fetches: an overview simplified to 50 m and one
  file per canton, so a page loads a few hundred kB rather than the 23 MB of boundaries. The
  canton lookup on the territory page shows a municipality's cantons on the same map, and the
  address lookup prototype on the canton boundaries page is the court finder now.

- The explorer has a court finder, `/jurisdiction/`: pick a municipality or postal code and it
  lists every court with jurisdiction there, from the justice of the peace to the court of
  appeal and the court of assize, with what each one hears, its registry's address, phone,
  e-mail and website, and the municipality's police zone. In a city split over cantons it asks
  for the street and number, places them in the canton boundaries as the address lookup does,
  and keeps only that canton's courts. An OpenStreetMap map (Leaflet) draws the municipality's
  cantons and the address, and a click on it places a point there instead; in Brussels it says the language of the proceedings
  picks between the Dutch- and the French-speaking court. The link holds the municipality and
  the address, so a result can be shared. It reads only the package's data, written by the
  site at build time to `jurisdiction.json`.
- The explorer's header puts its links on their own row, which no longer wraps onto two lines,
  and marks the page you're on.

- The sources run reads the laws of the last 60 days in the Belgian Official Journal on
  etaamb, a copy that GitHub's runners can reach, and opens the `cantons` issue for a law that
  changes the annex to the Judicial Code, until `pnpm build:cantons` has read Justel's text with
  that law in it. `pnpm build:cantons` records that text's date in
  `scripts/parse/annex-version.json`. The issue also says when etaamb has published nothing
  for 10 days.

- The divisions (afdelingen, divisions) of the courts of first instance, the enterprise and
  labour courts and the labour courts of appeal have their area: `cantons`, the cantons wholly
  in the division, and `municipalities` (REFNIS codes) where a decree splits a canton between
  divisions, as in the labour court of Hainaut and, since 2024, the court of first instance of
  Liège. Each area is the text in force of the royal decrees under art. 186 of the Judicial
  Code, consolidated from the decree of 14 March 2014, the courts' case-allocation decrees and
  every decree that changed them, all cited in the division's `sources`. A test checks that a
  court's divisions cover its area once. The police courts' divisions don't have theirs yet
  ([#58](https://github.com/pieterjanscheir/belgica/issues/58)).
- `findDivisionsWithJurisdiction(municipalityId, type)`: the division to file with for a
  municipality, or the court itself when it isn't divided or its division areas aren't in the
  data.

### Changed

- The Liège division of the labour court of appeal (`labour-court-of-appeal-liege-liege`) has
  no `arrondissement` any more. Its area is the province of Liège, which holds the arrondissement
  Eupen too, and a division's arrondissement now follows from its area, as a court's does.

### Fixed

- The release and the data pull request no longer depend on the bot: when the GitHub App gives
  no token (`BOT_CLIENT_ID` is set but the app isn't installed on the repository), the Prepare
  release and Sources workflows warn and use the workflow's own token instead of failing. A
  release pull request that can't be opened says where to open it by hand, and the sources
  issue says so when the data was rebuilt but its pull request couldn't be opened
  ([#159](https://github.com/pieterjanscheir/belgica/issues/159)).
- A data pull request carries every generated file that `pnpm check` verifies. It left
  `src/court-details-files.generated.ts` and `src/data-files.generated.ts` out, so one that
  added or removed a court made `pnpm check` fail on main. Both now read one list,
  `scripts/generated-files.ts` ([#160](https://github.com/pieterjanscheir/belgica/issues/160)).

## [0.8.0] - 2026-11-05

### Added

- **Procedural indemnity** (rechtsplegingsvergoeding / indemnité de procédure, part of
  [#60](https://github.com/pieterjanscheir/belgica/issues/60)): `data/procedural-indemnities.json`
  has the brackets of the general tariff and the three labour tariffs of the KB of 26 October
  2007 as the KB sets them, and every indexation since 1 January 2008: the steps of 10 % until
  2022, and the formula of the KB of 16 May 2024 from 1 March 2025. The new entry point
  `belgica/procedural-indemnities` (not in the root) has `getProceduralIndemnity(claim, date)`,
  `getProceduralIndemnityTable`, `getProceduralIndemnityIndexation`, `indexProceduralIndemnity`
  and `getProceduralIndemnityTariff`. The amounts of 1 March 2025 match the table of the College
  van de hoven en rechtbanken to the cent. The CSV release has the tariffs and the indexations as
  two tables.
- **A new indexation of the procedural indemnity comes in by itself**
  ([#60](https://github.com/pieterjanscheir/belgica/issues/60)): the sources workflow fetches
  Statbel's consumer price index every day (the other sources stay twice a week). When a month's
  index reaches the next threshold, 10 points above or below the last one, it adds the indexation
  from the first day of the next month and opens the data pull request with it. A manual run of
  the workflow picks one source, or all of them, from a dropdown.

### Fixed

- **Canton boundaries**: Gent 2 meets Oudenaarde point for point again. Moving Mariakerke to
  Gent 3 in 0.7.0 dropped a point of Gent 2 that lies on a straight line, which Oudenaarde
  keeps, so joining the two cantons left a sliver of about a metre near Deinze. The build now
  puts back the points a correction's cut drops, and a test checks that corrected cantons meet
  their neighbours point for point.
- The explorer's canton map keeps its tooltip inside the map: near the right or top edge it
  opens on the other side of the cursor instead of running off the map.

## [0.7.0] - 2026-11-04

### Added

- **Police zones** ([#7](https://github.com/pieterjanscheir/belgica/issues/7)): the 175 zones
  with their official number, their names in Dutch, French and German, their short name and the
  municipalities each covers, from FOD Financiën's open data (CC BY 4.0), rebuilt twice a week.
  `belgica/police-zones` has `getPoliceZone`, `findPoliceZone` and
  `getPoliceZoneMunicipalities`; the Python package has `get_police_zone`, `find_police_zone`
  and `get_police_zone_municipalities`. Addresses and contacts aren't in it: they're on police.be,
  which refuses GitHub's runners.
- The explorer shows each municipality's police zone, and counts the zones on its home page.
  The police zones page of the docs is in English, Dutch and French.

### Changed

- The sources run follows each site's `robots.txt`: it doesn't fetch a page the site
  disallows (the source fails and keeps its last snapshots), and waits as long as the site's
  `Crawl-delay` asks, which slows maisonsdejustice.be to one request every 10 seconds.
- The sources run says when the cantons need rebuilding by hand: it opens an issue labelled
  `cantons` when the NGI redraws a canton's boundary, or Statbel's REFNIS register opens or
  closes a municipality that `data/municipalities.json` doesn't reflect. The cantons themselves
  still come from ejustice, which refuses GitHub's runners
  ([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

### Fixed

- **Canton boundaries**: Mariakerke is in Gent 3, not Gent 2. The law of 15 May 2024 (art. 90)
  moved the sub-municipality on 1 January 2025, but the NGI still draws it in Gent 2, so
  `findCantonsAt` gave Gent 2 for every address in Mariakerke (9030). The build now moves the
  areas a law moved and the NGI hasn't redrawn yet, from Statbel's statistical sectors, and says
  when the NGI has caught up.

## [0.6.2] - 2026-11-02

### Fixed

- **Courts**: the contacts and hours of 14 courts, from the official sources on 2 November
  2026 ([#127](https://github.com/pieterjanscheir/belgica/pull/127)). Several now give the
  justice department's central `+32 2 682 …` numbers: the court of first instance of
  Luxembourg in Arlon, the enterprise court of Walloon Brabant and of Liège in Arlon, the
  justices of the peace of Brugge 1 to 4 and the police court of West Flanders in Brugge; the
  labour court of Hainaut in La Louvière drops a number. The justice of the peace of
  Sint-Pieters-Woluwe is closed on Fridays now. The justice of the peace of Sint-Genesius-Rode
  has no structured `openingHours` for now: its Dutch and French pages give different hours,
  and both texts are kept in `openingHoursText`.

### Changed

- The official sources are fetched twice a week (Monday and Thursday) instead of once, so a
  source that changes or breaks is noticed within a few days. When the workflow can't open the
  data pull request, it updates the open data-update issue instead of opening another one.
- A source that fails no longer holds back the others: the sources run rebuilds the data from
  the rest, keeps the failed source's last good snapshots, and lists it in the data pull request
  and the `data-freshness` issue. The houses of justice of the French Community are the first
  case: maisonsdejustice.be no longer lists them on a page.
- The French Community's houses of justice keep their 20 October 2026 data while
  maisonsdejustice.be no longer lists them: the sources run keeps their last snapshots instead
  of retiring them, and shows a warning rather than failing
  ([#125](https://github.com/pieterjanscheir/belgica/issues/125)).
- The sources run fetches the sites side by side, still one request per second to each: about
  14 minutes instead of 20.
- `pnpm test:package` checks the size of the package: the whole package unpacked (34.0 MB, limit
  40 MB), the package without the boundary files (4.3 MB, limit 6 MB) and any single file
  outside the boundaries (limit 1 MB), with the numbers in CI's job summary
  ([#82](https://github.com/pieterjanscheir/belgica/issues/82)).
- The contributing guide says how to add a dataset without growing the package, and that
  registers of individual people stay out
  ([#83](https://github.com/pieterjanscheir/belgica/issues/83)).
- The roadmap drops the registers of judicial experts and mediators, and plans the chambers of
  bailiffs and of notaries instead of a directory of every bailiff and notary.

## [0.6.1] - 2026-10-22

### Changed

- **Look up an address**: type an address and get its canton and every court, including the
  justice of the peace in a city split over several cantons. It's a prototype on the
  [canton boundaries](https://pieterjanscheir.github.io/belgica/data/canton-boundaries) docs
  page and a new `/address/` page in the explorer. Geocoding uses each region's own address
  register (Adressenregister, UrbIS, ICAR); the package itself is unchanged
  ([#95](https://github.com/pieterjanscheir/belgica/pull/95)).
- The explorer says "has jurisdiction" and "courts with jurisdiction" in English, not
  "competent", as the package does since `findCourtsWithJurisdiction`
  ([#107](https://github.com/pieterjanscheir/belgica/pull/107)).

## [0.6.0] - 2026-10-22

### Added

**Public and judicial holidays, for deadlines: `belgica/calendar`.** `getPublicHolidays(year)`
gives the ten legal public holidays of any year from 1975 (law of 4 January 1974, royal decree
of 18 April 1974, art. 1), with the three that depend on Easter computed. `nextWorkingDay` moves
the last day of a deadline off a Saturday, Sunday or holiday (art. 53 Ger.W. / C. jud.), and
`isJudicialHoliday` tells whether a day is in the judicial holidays, 1 July to 31 August
(art. 334). Also `getPublicHoliday`, `isPublicHoliday`, `isWorkingDay` and `getEasterSunday`.
`data/public-holidays.json` holds the rules, not dates, and the one year a decree moved a
holiday: Ascension Day 2008, which fell on 1 May, moved to 2 May. Community holidays (11 July,
27 September, 15 November) aren't legal holidays and aren't in it. Tested against the Royal
Observatory's published lists for 2024 to 2027 ([#61](https://github.com/pieterjanscheir/belgica/issues/61)).

### Changed

**`findCompetentCourts` is now `findCourtsWithJurisdiction`, and `find_competent_courts` is now
`find_courts_with_jurisdiction`.** "Jurisdiction" is the English term for _bevoegdheid_ /
_compétence_. The old names still work, are deprecated, and go in 1.0. The API docs'
"Competence" section is now "Jurisdiction" (`#jurisdiction`).

- Every exported function, constant and schema in `src/` has a doc comment, so editor hovers
  describe the whole API, and `pnpm lint` (`eslint-plugin-jsdoc`) keeps it that way
  ([#85](https://github.com/pieterjanscheir/belgica/issues/85)).
- The [explorer](https://belgica.scheir.eu/) is in the docs' 13 languages, with next-intl, and moved from
  GitHub Pages to Vercel: a page in every language is about 29,000 pages, over the 1 GB a Pages
  site may hold. It still isn't part of the package.
- The English documentation is rewritten: an introduction, core concepts (ids, validity, `on`,
  coverage, missing data versus errors), common tasks with a "which function?" table, and a
  page on entry points and bundle size. Every API entry now has its signature, results, errors
  and an example, and every data page the same "Source and updates" rows. The 12 translations
  follow later.

## [0.5.0] - 2026-10-22

### Added

**A Python package: `pip install belgica`.** The same data and helpers on PyPI, in snake case,
with the same version number: `get_court`, `find_courts`, `get_cantons_for_municipality`,
`find_competent_courts`, `find_courts_for_postal_code`, `find_cantons_at`,
`find_arrondissements_at`, `get_court_location`, `format_court_name`, `get_interest_rate` and the
rest. Records are the dicts from the JSON, typed with `TypedDict`s in
`belgica.types`. Python 3.11 or later, no dependencies. `pnpm build:cases` writes the answers of
the TypeScript helpers for every municipality, postal code, canton and court, a grid of points
(their canton and arrondissement), every court's location and interest rates since 1969, and the Python tests check the package gives the same ones.

**Smaller files for apps that need only some courts.** JSON can't be tree-shaken, so a browser
app that imported `findCourts` and `formatCourtName` from `belgica/courts` shipped every court:
410 KB minified (46 KB gzip). `data/courts.json` stays the complete file and the source of
truth; the build now splits it, and the package ships the result (it isn't committed):

- `data/courts/<type>.json`: one court type, all of Belgium;
- `data/courts/<type>/<arrondissement>.json`: one type in one arrondissement, the building
  blocks (every court is in exactly one). A court without an arrondissement, whose area covers
  several, is in `data/courts/<type>/judicial-area/<area>.json`;
- `data/courts/details/<id>.json`: one court's `contacts`, `openingHours`, `openingHoursText`,
  `website`, `sources` and `ecli`, which the list files leave out;
- `data/courts/index.json`: each court id and the file it is in.

The list files hold summaries (`CourtSummary`); a summary and its details (`CourtDetails`)
together are the full record. Every path under `data/` is public API from now on: renaming or
removing one is a major version. An app that imports the justices of the peace of East and West
Flanders (38 courts) and formats their names ships 15 KB minified (2.2 KB gzip); CI checks it
stays under 30 KB and holds nothing of the other courts or the cantons.

**`belgica/courts/load`**: `loadCourts({ type, arrondissement? })`, `loadCourt(id)` and
`loadCourtDetails(id)` load those files on demand, one `import()` per file, so a bundler makes
a chunk of each and a browser downloads only what it asks for. The loader itself is 8 KB
minified (2 KB gzip); the first `loadCourtDetails` also loads the map of the details files,
31 KB (5 KB gzip).

**`belgica/courts/format`**: `formatCourtName`, `getContact`, `formatPhoneNumber` and
`formatIban` without any data, for a court you already hold.

**A canton label on every justice of the peace: `label: { nl, fr, de }`**, exactly what
`formatCourtName(court, locale, { style: 'canton' })` gave: `Vredegerecht 1e kanton Gent`. It is
generated from the cantons, in the JSON Schema and in the CSV (`label_nl`, `label_fr`,
`label_de`). `formatCourtName` uses it, so building a label doesn't need the cantons at run
time; for a record without one (saved before this version), `belgica/courts` still builds it,
`belgica/courts/format` gives the official name. The labels add 3 KB gzip to `belgica/courts`
(52.1 to 55.0 KB), so its size limit in CI goes from 54 to 57 KB.

**The cantons without their territory texts: `belgica/cantons`**, with `cantons` and
`getCanton(id)` for a canton's name, number, seat, arrondissement and municipalities, from
`data/cantons/summaries.json`. The texts, most of the cantons data, are in
`data/cantons/territory.json` and `getCantonTerritory(id)` from `belgica/cantons/territory`.
`belgica/territory` keeps the full records, so `getCanton(id).territory` works as before.

`belgica/courts`, `belgica/territory` and the root keep their exports and full records.

**Arrondissement boundaries and court locations, from the NGI file the canton boundaries
already came from.** `data/arrondissement-boundaries.json` has the boundary of each of the 12
judicial arrondissements as a GeoJSON MultiPolygon, with `findArrondissementsAt(lon, lat)` and
`getArrondissementBoundary(id)` in `belgica/arrondissement-boundaries`. The build checks each
against its cantons: the NGI calls the arrondissement of Leuven `Vlaams Brabant`, and the
areas show it is Leuven, not the province. `data/court-locations.json` has a GeoJSON point for
139 of the 162 justices of the peace, with `getCourtLocation(courtId)` in
`belgica/court-locations`. The NGI hasn't moved every point when a court moved, so a point is
only kept when the NGI's address has the house number of the court's own; the other 23 are left
out and listed by the build. Both have their own entry point and CSV table, and the root doesn't
load them. The GeoPackage reader now reads points, and geometries with a Z (dropped).

### Changed

- The release pull request and the weekly data pull request run CI when the repository's GitHub
  App is set up. GitHub releases take their notes from the version's section of this changelog.
  `CHANGELOG.md` merges with git's union driver, so branches no longer conflict on Unreleased.
- The package is half the size: the canton boundaries are in it once. `belgica/canton-boundaries`
  used to inline `data/canton-boundaries.json` into its JavaScript, so the 22 MB of geometry was
  in the package twice. It now imports the file from `data/` with `with { type: 'json' }`, which
  Node ≥ 22.12 and current bundlers support, and so does `belgica/arrondissement-boundaries`.
  The API is the same. The package went from 51 MB to about 36 MB unpacked, with the 8 MB of
  arrondissement boundaries added since (#80).
- Releases are prepared by a workflow, which opens the release pull request, and published when
  it's merged. Pull requests get a preview package on pkg.pr.new. CI adds CodeQL, OpenSSF
  Scorecard, zizmor and dependency review, and every action is pinned to a commit.
- The [explorer](https://pieterjanscheir.github.io/belgica/explore/), a Next.js site built on
  the package, is deployed with the docs: a page for every court, canton, municipality and postal
  code, the canton map and an interest calculator. It isn't part of the package.

## [0.4.0] - 2026-10-22

### Added

**Zod schemas for every record: `belgica/schemas`.** The types are now inferred from
[zod](https://zod.dev) schemas, which are the single source for the TypeScript types, the JSON
Schemas in `schema/` and the data checks in CI. Import them to validate a copy of the data, or
data built on it: `dataFileSchemas.courts.parse(json)`, `courtSchema`, `cantonIdSchema`, and so
on. The datasets only import the types, so zod isn't in their bundles (`belgica/courts` is the
same size), but it is now a dependency, as the type declarations import it.

The schemas are stricter than the old types, and the data passes them all: objects reject
unknown keys; optional fields are absent rather than `undefined`; a `Contact` is a union by
`type`, so a phone number, an email address and an IBAN each have their own pattern; URLs must
be http(s); a canton's `number` is a positive integer; coordinates are within WGS 84 ranges;
ECLI codes are capitals; `sources`, `periods` and a canton's `municipalities` are never empty.
The JSON Schemas say the same, and now describe every field, including those of a contact.

**Court names in a language: `formatCourtName(court, locale, { style })`**, in the root and
`belgica/courts`. `style: 'official'` (the default) gives the name as the court publishes it,
falling back to another language when it doesn't publish in `locale` (for German: French, then
Dutch). `style: 'canton'` gives a justice of the peace a display label built from its canton:
`Vredegerecht 1e kanton Gent`, `Justice de paix 1er canton Gand`, `Friedensgericht 1. Kanton
Gent`, `Vredegerecht kanton Deinze`. It is documented as a label, not the court's official name,
so the rule that legal facts are stored, not built, still holds for names. The French label
uses `Justice de paix`, as the courts call themselves, not `Tribunal de paix`
([#10](https://github.com/pieterjanscheir/belgica/issues/10)). Other courts and the seats of a
justice of the peace get their official name in both styles. German labels use the canton's
German name where it has one, and otherwise its name in the court's own language, French in
Brussels ([#45](https://github.com/pieterjanscheir/belgica/issues/45)).

**German names for the cantons of Eupen-Sankt Vith.** `name.de` is `Eupen-Sankt Vith` for
`eupen-sankt-vith-1` and `-2`, from the official German translation of the ministerial decree of
31 October 2023 (Belgisches Staatsblatt of 18 July 2024, numac 2024006205), which names the second
canton; the first is also named on its court's German page on the courts' portal ("Friedensgericht
des ersten Kantons Eupen-Sankt Vith"). Both are in the cantons' new `sources` field, and the
decree in `datapackage.json`. The annex to the Judicial Code has no German
translation, so no other canton has a German name: `scripts/german-canton-names.ts` lists the
sourced ones, and a test checks the data against it. `cantons.csv` gets a `name_de` column.

**`belgica/courts` stays small.** The labels read each canton's name and number from
`src/canton-names.generated.ts`, generated from `data/cantons.json` by `pnpm generate`, so the
courts entry point doesn't load the cantons' territory texts. It grows by about 2 KB gzipped,
to 52 KB. `pnpm test:package` fails if `belgica/courts` loads the cantons data or goes over
54 KB gzipped.

## [0.3.1] - 2026-10-21

### Fixed

The README said a day before a dataset's coverage throws a `RangeError`, right under
`getInterestRate`. `getInterestRate` returns `null` for any day without a rate, early days
included; only territory and court lookups throw for a day before their coverage. No code or
data changed.

## [0.3.0] - 2026-10-21

### Added

**Postal codes.** `data/postal-codes.json`: every Belgian postal code with the municipality it
belongs to, by REFNIS code, from Statbel's conversion table (CC BY 4.0): 1 152 records for 1 149
codes, since `1040`, `1050` and `1804` each belong to two municipalities. Ids are the two
official codes joined (`9000-44021`); every record carries a validity period read from the
table's own date, and the build fails when a code points at an unknown municipality or a
municipality has no code. Its own entry point, `belgica/postal-codes`, with
`getPostalCode`, `getMunicipalitiesForPostalCode`, `getPostalCodes` and `postalCodesCoverage`;
in the root, `findCourtsForPostalCode(postalCode, type)` chains a postal code to the justices
of the peace and the competent courts, per municipality, so a shared code is never resolved to
one of them. Sub-municipalities aren't in the data: bpost's list has them, but no REFNIS code
and no open licence
([#28](https://github.com/pieterjanscheir/belgica/issues/28)).

**Addresses link to their municipality.** `address.municipality` on courts, prisons and houses
of justice holds the REFNIS code the postal code belongs to; for a shared code the published
city line decides between the two, and the field is left out when it names both (the justice
of the peace of Etterbeek, `1040 Brussel (Etterbeek)`). A test checks that every court sits in
its arrondissement, or its judicial area's; the one exception, the justice of the peace of
Limbourg with a temporary seat in Eupen, is named in the test
([#28](https://github.com/pieterjanscheir/belgica/issues/28)).

**Canton boundaries** ([#29](https://github.com/pieterjanscheir/belgica/issues/29)).
`data/canton-boundaries.json` has the boundary of every canton as GeoJSON `MultiPolygon`
geometry in WGS 84, as the National Geographic Institute digitised it from the annex to the
Judicial Code (geo.be, CC BY 4.0), with the NGI's object id and canton code, fetched every week
with the other sources. One record per canton, keyed by the canton's id. The geometry is the
NGI's, unsimplified, to 7 decimals. A new entry point, `belgica/canton-boundaries`,
exports `cantonBoundaries`, `getCantonBoundary(cantonId)` and `findCantonsAt(lon, lat)`, the
cantons whose boundary holds a point: one for a point in Belgium, none outside it. The package
root doesn't re-export them: the file is 23 MB. The legal text in a canton's `territory` wins
where the geometry disagrees.

### Changed

**Renamed to `belgica` (breaking).** The package was `be-legal-data` up to 0.2.0; install
`belgica` and change the imports (`be-legal-data/courts` becomes `belgica/courts`). The data and
its ids are the same. The name leaves room for Belgian reference data beyond the legal kind.

**All courts, from the official source (breaking).** `data/courts.json` is now built every
week from the courts' portal, tribunaux-rechtbanken.be, instead of by hand: 347 courts,
divisions and seats instead of 46, and every canton has its justice of the peace.

- `Court` is one interface for every type of court: `type` adds `police-court`,
  `court-of-first-instance`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal` and
  `court-of-assize`; `kind` says whether a record is a court, a division or a seat, and
  `court` links a division to its court. `JusticeOfThePeace` and `EnterpriseCourtDivision` are
  gone.
- `name` is the name as the court publishes it, in each language it has a page in
  (`Vredegerecht Gent 1`), instead of a place name. `seat` and `number` are gone.
  `formatCourtName` is removed: it built names, and the French ones were wrong.
- `arrondissement` is optional (courts of appeal cover a judicial area); every court has a
  `judicialArea`.
- Contacts are `phone`, `fax`, `email` or `bank-account`, with the registry they belong to as
  `label` and the text published with them as `note`. `ContactLabel` and `bankAccount` are
  gone: a court has a bank account per registry, as a contact.
- `address` is optional (a court whose divisions each have an address has none), keeps the
  street line as published, and has no `houseNumber`.
- New fields: `ecli` (the court's ECLI codes), `openingHoursText` (the hours as published, per
  language), `website` per language, and `sources` on every record.
- `getContact` takes any record with contacts and a free-text label.
- Most phone numbers changed: the courts moved to central `02 682` numbers. 21 bank accounts
  that were in the hand-made data aren't on the courts' pages any more and are gone.

**Time.** Every record carries a validity period (`validFrom`, `validTo`), every dataset says
from which day it describes the situation (`territoryCoverage` and `courtsCoverage`: 1 January
2025; `prisonsCoverage` and `housesOfJusticeCoverage`: 20 October 2026, when their sites were
first read), and every lookup takes an optional day: `getCantonsForMunicipality('44021', { on:
'2025-09-15' })`, `getCourt(id, { on })`, `findCourts(filter, { on })`, `getPrison(id, { on })`.
A day before the coverage throws a `RangeError`. The exported arrays hold every version of a
record; a lookup by id without a day gives today's version.

**Scraped records are retired, never deleted.** When a source stops listing a court, prison or
house of justice, the weekly build keeps its record with a `validTo` (the day before the check
that missed it) instead of removing it, and a record the source starts listing gets a
`validFrom`. Ids, once published, stay.

**Legal basis.** A canton's `legalBasis` is `{ url, provision }`: the annex's ELI link (numac
1967101058, not the Justel file number 1967101007) and the section.

**New identifiers (breaking).** Every id now follows one rule: an official code where one exists, otherwise lowercase
kebab-case from the local-language name. See
[identifiers](https://pieterjanscheir.github.io/belgica/guide/identifiers). The package
had no users yet, so this was done before 1.0 rather than carried forever.

- Judicial areas: `Antwerp` → `antwerpen`, `Brussels` → `brussel`, `Ghent` → `gent`, `Liege` → `liege`, `Mons` → `mons`.
- Arrondissements: `Antwerp` → `antwerpen`, `Limburg` → `limburg`, `Brussels` → `brussel`, `Leuven` → `leuven`, `WalloonBrabant` → `brabant-wallon`, `EastFlanders` → `oost-vlaanderen`, `WestFlanders` → `west-vlaanderen`, `Liege` → `liege`, `Eupen` → `eupen`, `Luxembourg` → `luxembourg`, `Namur` → `namur`, `Hainaut` → `hainaut`.
- Cantons: the same name, lowercase, words joined by hyphens, number as a suffix:
  `Gent1` → `gent-1`, `MerelbekeMelle` → `merelbeke-melle`, `BraineLAlleud` → `braine-l-alleud`,
  `EupenSanktVith1` → `eupen-sankt-vith-1`.
- Courts: the court `type` followed by the place: `VredegerechtGent1` →
  `justice-of-the-peace-gent-1`, `OndernemingsrechtbankGentBrugge` →
  `enterprise-court-gent-brugge`.
- Municipalities: the REFNIS code moves from `refnis` to `id`; a canton's
  `municipalities[].refnis` is now `municipalities[].municipality`.
- A justice of the peace links to its canton through a new `canton` field (the canton id).
  `getJusticeOfThePeace` follows the link instead of building an id.
- A canton's `source` (the article of the annex) is now `legalBasis`, so it isn't confused with
  the `sources` (URLs) on other records.

**Distribution (breaking).** ESM only, Node 22.12 or later (`require()` still loads it there).
The CommonJS build and `typesVersions` are gone, and `dist/` is no longer in git: install from
npm.

**Canonical data (breaking).** Court phone numbers are E.164 (`+3253820701`), IBANs are in
electronic format (`BE73679200844560`), e-mail addresses lowercase, and opening hours in
OpenStreetMap `opening_hours` syntax (`Mo-Fr 08:30-12:30,13:30-16:00`).

**Other changes.**

- `getInterestRate` throws a `RangeError` for a string that isn't a valid `YYYY-MM-DD` day and
  for an invalid `Date`. Before, `'2013-1-15'` silently returned the second semester's rate
  (7.5 % instead of 8 %), and other malformed input returned `null` as if no rate were on file.
- The exported datasets are typed `readonly`, so TypeScript flags code that modifies the shared
  data. Copy an array before sorting or changing it.
- Lookups by id use an index instead of a linear search.
- `package.json` declares `"sideEffects": false`, so bundlers can drop unused datasets.

### Added

- Regions and provinces as datasets: `data/regions.json` (the 3 regions) and
  `data/provinces.json` (the 10 provinces, each with its `region`), keyed by their Statbel
  REFNIS code, with the names in Dutch, French and German as Statbel's REFNIS code list gives
  them, built weekly from the snapshots of that list. Every municipality gains a `region`;
  `Municipality.province` is typed `ProvinceId | '04000'` instead of `string` (a narrowing: the
  values are unchanged, and the 19 municipalities of the Brussels-Capital Region, which has no
  province, keep `'04000'`, the region's code, as Statbel's files have it). New lookups
  `getRegion`, `getProvince`, `getProvinceForMunicipality` (`undefined` in Brussels) and
  `getRegionForMunicipality`, types `Region`, `Province`, `RegionId` and `ProvinceId`, and
  `regions.csv` and `provinces.csv` in the releases.
- The documentation site is available in Dutch (/nl/) and French (/fr/) next to English, with a
  language switcher. English is the source; the translations follow it.
- `ids.lock.json`: every id the package has published, per dataset. `pnpm generate` adds new
  ids and never removes one, and the tests fail when a locked id is missing from the data, so a
  record can't disappear or be renamed by accident. Removing an id is a deliberate act, for a
  major version.
- Every court other than a justice of the peace lists the cantons it covers (`cantons`), as the
  annex to the Judicial Code (art. 3–5) and art. 114 of the Code set them, from a law table in
  `scripts/parse/jurisdictions.ts` that the build checks against the portal both ways. A
  court's `arrondissement` now follows from its cantons: the courts of appeal and labour court
  of appeal of Mons and the court of assize of Brussels-Capital gain one, the court of assize
  of Liège, which covers Eupen too, loses it.
- `findCompetentCourts(municipalityId, type)`: which court of a type is competent for a
  municipality, including the Halle and Vilvoorde police courts and both language courts in
  Brussels; `getCourtsForCanton(cantonId)`; and a `court-cantons.csv` table in the releases.
- Prisons: the 39 prisons and detention houses, in `data/prisons.json` and
  `belgica/prisons`.
- Houses of justice: the 14 Flemish (with OVO number) and 13 French-speaking houses, in
  `data/houses-of-justice.json` and `belgica/houses-of-justice`.
- `getDivisions(courtId)`; `findCourts` filters by `kind` and `judicialArea` too.
- A weekly workflow that fetches the official sources, keeps snapshots on the `sources` branch,
  rebuilds the data and opens a pull request when it changed.
- CSV tables of all data, attached with the JSON and schemas to every GitHub release.

- `formatPhoneNumber` and `formatIban` for display, `getArrondissementForMunicipality`, and
  `findJusticesOfThePeace(municipalityId)`, which answers "which justice of the peace?" for a
  municipality, including split cities.
- Quality gates: strict TypeScript, ESLint (type-aware), Prettier, 100 % coverage, IBAN checksum
  and contact-format tests, type tests.
- A [design decisions](https://pieterjanscheir.github.io/belgica/guide/design) page.
- Generated id types (`CantonId`, `CourtId`, `MunicipalityId`, `ArrondissementId`,
  `JudicialAreaId`). Lookups with a known id return the record without `undefined`; the JSON
  Schemas list the valid ids, so a dangling link fails validation.

- Entry points per dataset: `belgica/territory`, `belgica/courts` and
  `belgica/interest-rates`. Importing only the interest rates no longer bundles the
  canton texts (12 KB instead of 250 KB).
- `getJusticeOfThePeace(cantonId)`.
- JSON Schemas for every data file (`schema/`, also published on the documentation site).
- `datapackage.json`: a Frictionless Data Package descriptor with sources, licences and review
  dates for every dataset.
- A shared `SourceRef` type.
- Weekly freshness check that opens an issue when a rate is missing, a dataset is overdue for
  review or a source URL is dead.

### Fixed

- The French name of the third canton of Brussels was `judicaire de Bruxelles`: a typo in the
  annex ("canton judicaire") broke the parser. It is now `Bruxelles`, and the generator corrects
  the typo.

## [0.2.0] - 2026-10-18

### Added

- Judicial areas, arrondissements, all 162 cantons and the 565 municipalities, generated from
  the annex to the Judicial Code and Statbel.
- Published on npm with provenance.

## [0.1.0] - 2026-10-05

### Added

- Courts (justices of the peace in East and West Flanders, Ondernemingsrechtbank Gent) and the
  legal and commercial interest rates.

[Unreleased]: https://github.com/pieterjanscheir/belgica/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/pieterjanscheir/belgica/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/pieterjanscheir/belgica/compare/v0.6.2...v0.7.0
[0.6.2]: https://github.com/pieterjanscheir/belgica/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/pieterjanscheir/belgica/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/pieterjanscheir/belgica/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/pieterjanscheir/belgica/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/pieterjanscheir/belgica/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/pieterjanscheir/belgica/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/pieterjanscheir/belgica/compare/72889e0...v0.3.0
[0.2.0]: https://github.com/pieterjanscheir/belgica/commit/72889e0
[0.1.0]: https://github.com/pieterjanscheir/belgica/commit/c113197
