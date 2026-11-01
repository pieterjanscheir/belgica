# Postal codes

<script setup>
import { data as stats } from '../.vitepress/stats.data'
</script>

File: `data/postal-codes.json`. The {{ stats.postalCodes.codes }} Belgian postal codes, each
linked to the municipality it belongs to by REFNIS code: {{ stats.postalCodes.records }} records,
because {{ stats.postalCodes.shared }} postal codes belong to two municipalities.

## Why it's useful

- **From an address to the judicial map.** Addresses come with a postal code, not a REFNIS
  code. The postal code gives the municipality, and the municipality gives its cantons and
  courts: `findCourtsForPostalCode('9050', 'labour-court')` answers "which court for this
  address?" as far as the postal code can.
- **The postal codes of a municipality.** Validating a form, addressing a mailing, checking
  that an address and a REFNIS code agree: `getPostalCodes('44021')`.
- **The municipality of every court, prison and house of justice.** Their
  `address.municipality` is this link, applied to the postal code of the published address
  ([#28](https://github.com/pieterjanscheir/belgica/issues/28)).

## Source and updates

|              |                                                                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | Statbel's [conversion table from postal codes to REFNIS codes](https://statbel.fgov.be/nl/over-statbel/methodologie/classificaties/geografie), the table valid from 1 January 2025 (`…_va01012025.xlsx`)          |
| Built by     | `scripts/parse/postal-codes.ts` from the snapshots. The build fails when a code points at a REFNIS code that isn't in `municipalities.json`, or a municipality has no code                                        |
| Changes when | Statbel publishes a new table: municipalities merge, bpost adds or retires a postal code                                                                                                                          |
| Covers       | 1 January 2025 onwards: lookups for an earlier day throw a `RangeError` ([time](/api#time)). A later table gives the pairs it drops a `validTo` and the pairs it adds a `validFrom`, on the day the table applies |
| Checked      | Twice a week, by the [sources workflow](/guide/data-quality#how-the-data-is-built)                                                                                                                                |
| Licence      | © Statbel, [CC BY 4.0](https://statbel.fgov.be/en/cc-40)                                                                                                                                                          |

Statbel builds the table from bpost's postal offices and the municipalities of the FPS Finance.
It also carries a municipality name per row, which isn't stored here: it differs from Statbel's
own REFNIS list in a few places (`Tongeren-Borgloon` where the list says `Tongres-Looz`, and
`Saint-Nicolas` for Sint-Niklaas), and a record links to its municipality rather than copy it.
`getMunicipality(record.municipality).name` has the names.

## Shared postal codes

A municipality has several postal codes (Gent has ten), and a postal code belongs to one
municipality, with three exceptions:

| Postal code | Municipalities                                    |
| ----------- | ------------------------------------------------- |
| `1040`      | Brussel (`21004`) and Etterbeek (`21005`)         |
| `1050`      | Brussel (`21004`) and Elsene (`21009`)            |
| `1804`      | Vilvoorde (`23088`) and Zemst (`23096`): Cargovil |

For these, the street decides. `getMunicipalitiesForPostalCode` returns both municipalities, and
`findCourtsForPostalCode` answers per municipality, so a shared code is never silently resolved
to one of them.

## Fields

| Field                  | Type             | Description                                                                                                                                                               |
| ---------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PostalCodeId`   | The postal code and the REFNIS code, joined: `9000-44021`. Neither alone names a record; together they're both official and unique. See [identifiers](/guide/identifiers) |
| `validFrom`, `validTo` | string?          | The days the pair applies, as Statbel's tables give them; none: since the coverage starts, or still applies. See [time](/api#time)                                        |
| `postalCode`           | string           | The four-digit postal code                                                                                                                                                |
| `municipality`         | `MunicipalityId` | The municipality the postal code belongs to, by REFNIS code                                                                                                               |

```ts
interface PostalCode {
    id: PostalCodeId // '9000-44021'
    validFrom?: string
    validTo?: string
    postalCode: string // '9000'
    municipality: MunicipalityId // '44021'
}
```

## What isn't in it

- **Sub-municipalities** (deelgemeenten, sections de commune): Statbel's table stops at the
  municipality. bpost's own postal-code list names the localities, but carries no REFNIS code
  and is published under bpost's terms of use (all rights reserved), not an open licence, so
  it isn't used.
- **The street.** In a city split over cantons (Antwerpen, Gent, Brussel, Luik, …) the postal
  code gives the municipality, and the municipality gives several cantons. The street then
  decides: with the address's coordinates, `findCantonsAt` finds the canton in the
  [canton boundaries](./canton-boundaries).

## Helpers

Each is described, with its results and errors, in the [API reference](/api#postal-codes).

```ts
import { getMunicipalitiesForPostalCode, getPostalCodes } from 'belgica/postal-codes'
import { findCourtsForPostalCode } from 'belgica'

getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]

// Per municipality: its justices of the peace, and its courts of the type asked for
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: Gent, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]
```
