# Getting started

This page installs the npm package and takes you from a municipality to the court that has
jurisdiction over it, with the court's name, address and phone number. For Python, see
[Python](./python). For the JSON or CSV files without a package, see
[without JavaScript](./raw-json).

## Install

::: code-group

```bash [pnpm]
pnpm add belgica
```

```bash [npm]
npm install belgica
```

```bash [yarn]
yarn add belgica
```

:::

The package is ESM and ships its own type definitions. It runs in browsers and on Node 22.12 or
later, where `require()` loads it too, and is tested on Node 22.12, 22, 24 and 26. Its one
dependency, [zod](https://zod.dev), is only loaded by `belgica/schemas`.

## Your first lookup

Municipalities are identified by their REFNIS code, the code Statbel assigns. Merelbeke-Melle is
`44088`. Find its canton, then the canton's justice of the peace:

```ts
import {
    formatCourtName,
    formatPhoneNumber,
    getCantonsForMunicipality,
    getContact,
    getJusticeOfThePeace,
} from 'belgica'

const [canton] = getCantonsForMunicipality('44088')
canton.id // 'merelbeke-melle'

const court = getJusticeOfThePeace(canton.id)
formatCourtName(court, 'nl') // 'Vredegerecht Merelbeke-Melle'
court.address
// { street: 'Hundelgemsesteenweg 622-624', postalCode: '9820', city: 'Merelbeke', municipality: '44088' }

const phone = getContact(court, 'phone') // '+3226820240'
if (phone) formatPhoneNumber(phone) // '02 682 02 40'
```

Every record is a plain, read-only object with the fields described on its
[data page](/data/courts#fields). Phone numbers are stored in E.164 form, and `formatPhoneNumber`
writes them the Belgian way for display.

### Cities split over several cantons

Merelbeke-Melle lies in one canton. Antwerpen, Gent, Brussel, Luik and other large cities are
split over several, and the street decides:

```ts
getCantonsForMunicipality('44021').map((c) => c.id) // Gent: ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

Each of these cantons has the law's description of its part of the city in `territory`. With the
address's coordinates, `findCantonsAt` picks the canton for you. See
[which justice of the peace for an address](./common-tasks#which-justice-of-the-peace-for-an-address),
or try it on the map in the [court finder](./court-finder).

## Look up by id

Every record has an `id`, and each dataset has a `get…` function that takes one. Ids are stable,
so store them rather than names:

```ts
import { getCourt, getMunicipality } from 'belgica'

getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
getMunicipality('44021').name // { nl: 'Gent', fr: 'Gand' }
```

In TypeScript, an id the compiler knows (a literal, or a value typed `CourtId`) returns the
record itself. Any other string returns the record or `undefined`, so input from a user or a
database has to be checked:

```ts
getCourt('court-of-appeal-brussel') // Court
getCourt(input) // Court | undefined
```

## Ask about a day

Courts, cantons and municipalities change. Every lookup answers for today, or for the day you
pass as `on`:

```ts
getCantonsForMunicipality('44088', { on: '2025-09-15' }) // the day the summons was served
getCantonsForMunicipality('44088', { on: '2020-01-01' }) // RangeError: before the data's coverage
```

The data describes the territory and the courts from 1 January 2025. For an earlier day a lookup
throws rather than answer with today's map. [Core concepts](./concepts#time) explains validity
periods and coverage.

## Handle what the data doesn't know

The functions never guess. They tell you when they have no answer:

| Situation                               | Result                        |
| --------------------------------------- | ----------------------------- |
| An id that isn't in the data            | `undefined`                   |
| A search that matches nothing           | `[]`                          |
| A day with no interest rate on file     | `null` from `getInterestRate` |
| A malformed day, or one before coverage | a `RangeError` is thrown      |

```ts
import { getInterestRate, getLatestKnownRateDate } from 'belgica'

const result = getInterestRate('2024-06-15', 'legal')
// { rate: 5.75, period: { from: '2024-01-01', to: '2024-12-31' } }

if (result === null) {
    console.warn(`No rate on file; the data reaches ${getLatestKnownRateDate('legal')}`)
}
```

## Import less

Importing from `belgica` loads every dataset except the boundaries and the court locations. Each
dataset also has its own entry point, which keeps a browser bundle small:

```ts
import { getInterestRate } from 'belgica/interest-rates' // a few kilobytes
import { getCourt } from 'belgica/courts'
```

[Entry points and bundle size](./entry-points) lists them all with their measured sizes.

## Next steps

- [Core concepts](./concepts): ids, links between records, days and coverage, languages.
- [Common tasks](./common-tasks): the usual questions, and which function answers each.
- [API reference](/api): every function, with its signature, results and errors.
- [Data](/data/): what each dataset holds, where it comes from and how current it is.
