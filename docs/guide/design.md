# Design decisions

The package was redesigned before its first users, so every choice could be made on its merits
instead of for compatibility. This page records each decision, why it was made, and what
follows from it. A new decision gets a new entry; a reversed one is marked, not deleted.

## 1. The data is the product; the code is a convenience

**Decision.** The official sources are the truth; the JSON files in `data/` are built from them
and are the product. They're usable without any of the TypeScript: from Python, a spreadsheet
(the releases include CSV tables) or `jq`. The shape of each file is defined once, by the
TypeScript types, and published as a JSON Schema generated from them; CI fails when the types,
the schemas and the data disagree. The library adds types, indexes and helpers, and nothing in
it is needed to understand the data.

**Why.** Reference data outlives the code around it, and most consumers of Belgian legal data
aren't JavaScript projects.

**So.** Every file has a [JSON Schema](./schema) and an entry in `datapackage.json` with its
sources and licence. Field names and values are explained in the docs, not only in code.

## 2. Legal facts are data, never computed

**Decision.** Anything with legal meaning (a court's name, a canton's territory, a rate) comes
verbatim from an official source and is stored. Code may format or look up; it may not
construct a legal fact.

**Why.** Code that assembles a fact can be wrong in ways tests can't catch: the French court
names an earlier `formatCourtName` built were wrong (`Tribunal de paix …`, where the courts call themselves `Justice de paix …`; [#10](https://github.com/pieterjanscheir/belgica/issues/10)).
A stored value can be checked against its source.

**So.** Court names are stored as each court publishes them, in every language it publishes
in. `formatCourtName` looks a name up (`style: 'official'`); its `'canton'` style builds a
display label from the canton's number and name ('Vredegerecht 1e kanton Gent'), documented as
a label and never as the official name. Canton territories stay verbatim legal text, with their
legal basis as an ELI link. Where a source is missing, the field is missing: nothing is filled
in by guesswork. The same goes for parsing: an opening-hours text with a note in it, a phone
number without its area code or an address written as a sentence is left out, not guessed.

## 3. One identifier rule

**Decision.** An official code where one covers every record, otherwise lowercase kebab-case
from the local-language name; courts are `type` + place. Official codes that cover only some
records (ECLI, OVO) are fields. See [identifiers](./identifiers).

## 4. Links are fields

**Decision.** Records refer to each other only through fields holding the other record's id,
named after the dataset they point into (`arrondissement`, `canton`, `municipality`). No id is
built from another.

**Why.** A relation hidden in a string format breaks silently when either side changes. A field
is validated by the schema (which lists the valid ids) and by the tests.

**So.** The address of a court, prison or house of justice links to its municipality the same
way (`address.municipality`), through the postal code in Statbel's conversion table, never
through the city name ([#28](https://github.com/pieterjanscheir/belgica/issues/28));
a postal code record links to its municipality rather than copy its name.

## 5. Canonical values, presentation in code

**Decision.** Each value is stored in one canonical, standard form, and formatting for people is
a function:

| Value         | Stored as                       | Standard                      |
| ------------- | ------------------------------- | ----------------------------- |
| Day           | `2024-06-15`                    | ISO 8601                      |
| Phone         | `+3253820701`                   | E.164                         |
| IBAN          | `BE73679200844560`              | ISO 13616 electronic format   |
| Opening hours | `Mo-Fr 08:30-12:30,13:30-16:00` | OpenStreetMap `opening_hours` |
| Language      | `nl`, `fr`, `de` keys           | ISO 639-1                     |

**Why.** One form per value makes values comparable, validatable (the IBAN checksum is tested)
and usable by other software (`tel:` links, payment systems, opening-hours parsers). Display
conventions vary by context; the data shouldn't.

## 6. Provenance on every record

**Decision.** Every dataset lists its sources, licence and review date in `datapackage.json`;
every scraped record lists the pages it was read from and the day their content was first seen
(`sources: [{ url, retrieved }]`).

**Why.** "Where does this come from, and how old is it?" is the first question for legal data.

## 7. The data is built by machines, from kept snapshots

**Decision.** Twice a week a workflow fetches the official sources, keeps the pages as snapshots
on the `sources` branch, rebuilds the data from them with the parsers in `scripts/parse`, tests
it, and opens a pull request when it changed. Nothing is typed in by hand. A separate weekly
job checks for missing interest rates, overdue reviews and dead sources.

**Why.** Legal data goes stale silently; people forget, schedules don't. Hand-entered data
can't be checked or redone; a parser can be tested, and the snapshots show exactly what the
source said on the day. The pull request keeps a person in the loop: the data in `main` never
changes unreviewed.

**So.** Snapshots live on their own branch, so the package's history isn't weighed down by
megabytes of HTML. The parsers are tested on trimmed copies of real pages. A page the parser
can't place stops the build instead of producing a half-right record. Two sources refuse
GitHub's servers (ejustice, police.be); they're fetched from a regular machine
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

## 8. Distribution: ESM only, Node 22.12+, built on release

**Decision.** The package is ESM only, requires Node 22.12 or later, and the build output isn't
committed: it's built and published to npm by the release workflow, with provenance.

**Why.** Node 18 and 20 are end of life. From Node 22.12, `require()` loads ESM, so a separate
CommonJS build would only add a second copy of the data (the dual-package hazard) and more to
test. Committed build output goes stale and broke automated dependency updates.

**So.** `import` and `require()` both work, tested on Node 22.12, 22, 24 and 26. Each dataset
has its own entry point, so an app that needs only the interest rates loads a few kilobytes,
not the courts and the legal text of every canton (the
[entry points page](./entry-points#measured-sizes) measures each one from the build).

## 9. Types that carry the data's guarantees

**Decision.** Ids are generated union types; datasets are `readonly`; lookups with a known id
return the record, not `record | undefined`; closed vocabularies (court types, kinds, contact
types) are unions. Contact labels are free text, as the court publishes them: a closed list
would mean mapping hundreds of registry names onto a few words, which is guessing.

**Why.** Mistakes surface while typing instead of in production, and the types document the
data.

## 10. Quality gates

**Decision.** Every change passes: strict TypeScript (including `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`), ESLint with type-aware strict rules, Prettier, 100 % test
coverage of `src/`, JSON Schema validation of all data, integrity tests (ids, links, counts,
periods), and `publint` + `arethetypeswrong` on the packed package.

**Why.** A reference package is only worth depending on if it's more reliable than copying the
data by hand.

## 11. Time is part of the model

**Decision.** Records carry a validity period (`validFrom`, `validTo`, both days included), each
dataset says from which day it describes the situation (`territoryCoverage`, and
`temporalCoverage` in `datapackage.json`), and lookups take an optional day: `getCanton(id, {
on })`, `getCantonsForMunicipality(refnis, { on })`. A day before the coverage throws a
`RangeError`.

**Why.** Legal questions are about a day: which court had jurisdiction when the summons
was served, which rate applied when the invoice fell due. Cantons, municipalities and courts
change; a model that only knows "now" answers questions about the past with today's map, and
looks right while doing it. Adding time later would change every id and lookup, so it's in the
model before the history is in the data
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

**So.** Interest rates already have periods. A lookup by id without a day gives today's
version, so known ids keep their non-`undefined` type; with a day it may find nothing. Every
dataset carries the period, not only the territory: a scraped record the source stops listing
is retired with a `validTo` rather than deleted (`scripts/parse/retire.ts`), so an id, once
published, stays, and a court that closes is still the court last year's summons named.

## 12. Releases carry the data, not only the package

**Decision.** Each GitHub release has the data as JSON and as CSV tables, with the schemas
and `datapackage.json`, as one zip. npm is one way to get the data, not the only one.

**Why.** The people who need Belgian legal reference data most work in spreadsheets and other
languages, not in JavaScript.

## 13. Geometry is a second source, and the text wins

**Decision.** The canton boundaries are the National Geographic Institute's digitisation of
the annex to the Judicial Code, taken as published (vertex for vertex, no simplification,
coordinates to a centimetre) and matched to the cantons by name in both languages, with an
explicit alias table for the rest. The canton's `territory` text stays the law: where the
geometry and the text disagree, the text wins. The geometry has its own entry point and the
package root doesn't re-export it.

**Why.** The NGI's polygons are an official reading of the same text, so they can be cited and
rebuilt; a boundary derived here from street data would be a third reading nobody can check.
Simplification would move the line, and the lines matter most where cantons meet. A million
positions would dwarf every other dataset, so nobody should load them by accident.

**So.** `findCantonsAt(lon, lat)` answers from the geometry and the documentation says so;
a point near a line is a case for the text. The sources build fails when a canton has no
boundary or a feature matches no canton ([#29](https://github.com/pieterjanscheir/belgica/issues/29)).

## Not decided yet

| Question                                                    | Issue                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| History before 1 January 2025                               | [#27](https://github.com/pieterjanscheir/belgica/issues/27)                    |
| Interest calculation over a period (day count, compounding) | Not planned until the method can be sourced from case law or official guidance |
