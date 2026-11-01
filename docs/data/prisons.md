# Prisons

<script setup>
import { data as stats } from '../.vitepress/stats.data'
</script>

File: `data/prisons.json`. The {{ stats.prisons }} prisons and detention houses of the FPS Justice
(Directorate-General of Penitentiary Institutions).

## Why it's useful

- **Writing to a detainee or their prison.** Lawyers, families and services need the prison's
  address and phone number; the names differ by language (`Gevangenis van Bergen`,
  `Prison de Mons`, `Gefängnis Mons`).
- **Depositing money.** Where FPS Justice publishes the prison's account for money for
  detainees, it's in the contacts as a `bank-account`, checksum verified.
- **Forms and case files.** A stable id per institution to store with a file, and a list to
  pick from.

## Source and updates

|              |                                                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | [FPS Justice: Belgian prisons](https://justitie.belgium.be/nl/themas_en_dossiers/gevangenissen/belgische_gevangenissen), each prison's page in Dutch, French and German |
| Built by     | `scripts/parse` from the snapshots                                                                                                                                      |
| Changes when | A prison opens or closes, or changes its contact details                                                                                                                |
| Covers       | 20 October 2026 onwards, the day the site was first read: lookups for an earlier day throw a `RangeError` ([time](/guide/concepts#time))                                |
| Checked      | Twice a week, by the [sources workflow](/guide/data-quality#how-the-data-is-built)                                                                                      |
| Licence      | CC BY 4.0                                                                                                                                                               |

## Fields

| Field                  | Type                              | Description                                                                                                                  |
| ---------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PrisonId`                        | From the name in the local language, without articles: `gevangenis-gent`, `prison-lantin`, `detentiehuis-kortrijk`           |
| `validFrom`, `validTo` | string?                           | The days the record applies, as the site listed it; none: since the coverage starts, or still applies. See [time](/api#time) |
| `kind`                 | `'prison'` \| `'detention-house'` | A detention house holds people with short sentences, close to home                                                           |
| `name`                 | `{ nl, fr, de }`                  | As FPS Justice publishes it                                                                                                  |
| `address`              | `Address`                         | In the local language, with the municipality its postal code belongs to (`municipality`, by REFNIS code)                     |
| `contacts`             | `Contact[]`                       | Phone, fax, e-mail and the account for money for detainees, where published                                                  |
| `website`              | `{ nl, fr, de }`                  | The prison's page per language                                                                                               |
| `sources`              | `{ url, retrieved }[]`            | The pages the record was read from                                                                                           |

The name of the director, which the pages also give, is left out: it changes, and it's
personal data the package doesn't need.

```ts
import { getPrison, prisons } from 'belgica/prisons'

getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
prisons.filter((p) => p.kind === 'detention-house') // Kortrijk, Olen, Vorst
```
