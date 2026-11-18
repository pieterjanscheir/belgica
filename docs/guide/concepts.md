# Core concepts

Every dataset and function follows the same few rules. This page explains them once. The data
pages and the [API reference](/api) assume them.

## Records and ids

Each dataset is an array of records, and every record has an `id` that is unique within its
dataset. An id is an official code where one covers every record (the REFNIS code for
municipalities), and otherwise a readable kebab-case key in the local language:

| Dataset        | Example ids                                              |
| -------------- | -------------------------------------------------------- |
| Municipalities | `44021` (Gent), `21004` (Brussel)                        |
| Cantons        | `gent-1`, `merelbeke-melle`, `wavre-1`                   |
| Courts         | `justice-of-the-peace-gent-1`, `police-court-brussel-fr` |
| Postal codes   | `9000-44021`: the postal code and the REFNIS code        |

Ids never change within a major version, and an id is never reused for something else. Store
ids, not names, in your database and your URLs. Don't parse them: every part of an id is also a
field. [Identifiers](./identifiers) has the full rules and the reasons for them.

In TypeScript every dataset has an id type (`CantonId`, `CourtId`, `MunicipalityId`, …), a union
of the ids in the data. A lookup with a value of that type returns the record. A lookup with any
other string returns the record or `undefined`.

## Links between records

Records refer to each other by id, in a field named after the dataset it points into:

```ts
getCourt('justice-of-the-peace-gent-1').canton // 'gent-1'
getCanton('gent-1').arrondissement // 'oost-vlaanderen'
getCanton('gent-1').municipalities // [{ municipality: '44021', partial: true }]
getCourt('labour-court-gent-brugge').court // 'labour-court-gent': a division links to its court
```

Follow a link with the `get…` function of the dataset it points into. Never by name: names
change spelling between sources and languages, ids don't. The [data overview](/data/#how-the-datasets-fit-together)
shows how the datasets connect.

## Time

### Validity periods

A record can carry a validity period: `validFrom`, its first day, and `validTo`, its last. Both
are `YYYY-MM-DD` and both days are included. A record without `validFrom` applies since the
dataset's coverage starts. One without `validTo` still applies.

When a source stops listing something, its record isn't deleted. It gets a `validTo`, so its id
keeps working and lookups for an earlier day still find it. When a canton or a court changes,
the new version is a new record. The exported arrays (`courts`, `cantons`, …) hold every
version.

### Looking up a day

Every lookup answers for today, or for the day you pass as `on`. Today is the day in Belgium
(Europe/Brussels), whatever the time zone of the machine the code runs on:

```ts
getCantonsForMunicipality('44021') // today
getCantonsForMunicipality('44021', { on: '2025-09-15' }) // on that day
```

- A function that returns a list (`getCantonsForMunicipality`, `findCourts`, …) returns the
  records that apply on that day.
- A lookup by id with `on` returns the version that applied that day, or `undefined` if none
  did.
- A lookup by id without `on` always finds a known record: today's version, or the last version
  of a record that has ended. Check `validTo` before you file something at a court you looked up
  this way.

### Coverage

Each dataset describes the situation from a given day. Before it, the data can't answer, and a
lookup throws a `RangeError` rather than answer with today's map:

| Dataset                               | Covers from                     | Constant                                                       |
| ------------------------------------- | ------------------------------- | -------------------------------------------------------------- |
| Territory: cantons, municipalities, … | 1 January 2025                  | `territoryCoverage`                                            |
| Courts                                | 1 January 2025                  | `courtsCoverage`                                               |
| Postal codes                          | 1 January 2025                  | `postalCodesCoverage`                                          |
| Prisons, houses of justice            | 20 October 2026                 | `prisonsCoverage`, `housesOfJusticeCoverage`                   |
| Canton and arrondissement boundaries  | 21 October 2026                 | `cantonBoundariesCoverage`, `arrondissementBoundariesCoverage` |
| Court locations                       | 21 October 2026                 | `courtLocationsCoverage`                                       |
| Public holidays                       | 1975                            | none: `getPublicHolidays` throws for an earlier year           |
| Interest rates                        | 1970 (legal), 2002 (commercial) | none: `getInterestRate` returns `null` before                  |

The territory and the courts follow the law as amended for 1 January 2025. The other dates are
the days a source was first read. Earlier history is planned
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

### Days

Wherever a function takes a day, it accepts a `Date` or a string:

- A `Date` is read as its day in Belgium (Europe/Brussels), whatever the machine's time zone.
- A string must start with a valid `YYYY-MM-DD` day. A time after it with an offset (`Z` or
  `±hh:mm`, as in an ISO timestamp) is read as that instant's day in Belgium; a time without an
  offset is a time in Belgium, so the day is the one written.
- Anything else, such as `'2024-6-1'`, `'15/01/2024'`, `'2024-02-30'` or an invalid `Date`,
  throws a `RangeError`.

Days are compared as strings, which is why a loose format is refused instead of silently
falling into the wrong period. Functions that return a day return it as `YYYY-MM-DD`.

## Missing data and errors

The functions keep two cases apart: the data has no answer, and the question is wrong.

| Situation                                           | Result              |
| --------------------------------------------------- | ------------------- |
| A lookup by an id that isn't in the data            | `undefined`         |
| A search or list that matches nothing               | `[]`                |
| A day with no interest rate on file                 | `null`              |
| A field the source doesn't give, such as an address | the field is absent |
| A malformed day or coordinate                       | `RangeError`        |
| A day before a dataset's coverage                   | `RangeError`        |

Nothing is filled in by guesswork. A court that publishes no single address has no `address`,
and an interest rate that hasn't been published yet is `null`, not 0. Handle both.

## Languages

Belgium has three official languages, and the data keeps each value in the languages its source
publishes it in. The keys are ISO 639-1 codes:

| Type         | Shape               | Used for                                                                      |
| ------------ | ------------------- | ----------------------------------------------------------------------------- |
| `Translated` | `{ nl, fr, de }`    | Names published in all three: arrondissements, regions                        |
| `Bilingual`  | `{ nl, fr }`        | Names and texts from the Judicial Code, which has no consolidated German text |
| partial      | `{ nl?, fr?, de? }` | Court names: only the languages the court publishes in                        |

A court in Flanders publishes in Dutch only, a court in Brussels in Dutch and French, the courts
in Eupen in German and French. Court names are never translated by the package.
`formatCourtName(court, locale)` gives the name in the language asked for, or in another the
court publishes in.

## Legal text and derived data

Where the data holds both the law's text and a reading of it, the text is the law:

- A canton's `territory` is the annex to the Judicial Code, verbatim. The
  [canton boundaries](/data/canton-boundaries) are the National Geographic Institute's digitisation
  of it. Near a boundary line, read the text.
- A justice of the peace's `label` (`Vredegerecht 1e kanton Gent`) is built for display. Its
  official name is in `name`.

## Read-only data

The exported arrays and records are typed `readonly` and shared by every caller. Copy before
you sort or change them:

```ts
const sorted = [...courts].sort((a, b) => a.id.localeCompare(b.id))
```
