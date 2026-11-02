<script setup>
import { data as stats } from '../.vitepress/stats.data'
</script>

# Houses of justice

File: `data/houses-of-justice.json`. The houses of justice (justitiehuizen, maisons de
justice) of the Flemish and French Communities: {{ stats.housesOfJustice }} records.

Houses of justice guide and supervise offenders on the courts' and prosecutors' behalf
(probation, electronic monitoring, community service), welcome victims, and write social
studies for the family courts. The Communities run them since 2015.

## Why it's useful

- **Family law.** A family court orders a social study from the house of justice of the
  family's area; lawyers and parties need its contacts.
- **Criminal law.** Probation conditions, alternative sentences and electronic monitoring are
  followed up by the house of justice; so is the reception of victims.
- **Linking.** The Flemish houses carry their OVO number, the identifier in the Flemish
  organisation register ([Wegwijs](https://wegwijs.vlaanderen.be)), so the data joins with
  other Flemish government data.

## Source and updates

|              |                                                                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | [vlaanderen.be: Justitiehuizen](https://www.vlaanderen.be/agentschap-justitie-en-handhaving/justitie/justitiehuizen) (Flemish Community) and [maisonsdejustice.be](https://www.maisonsdejustice.be/menu-de-droite/trouverunemj/) (French Community) |
| Built by     | `scripts/parse` from the snapshots                                                                                                                                                                                                                  |
| Changes when | A house of justice moves, or changes its contact details                                                                                                                                                                                            |
| Covers       | 20 October 2026 onwards, the day the sites were first read: lookups for an earlier day throw a `RangeError` ([time](/guide/concepts#time))                                                                                                          |
| Checked      | Twice a week, by the [sources workflow](/guide/data-quality#how-the-data-is-built)                                                                                                                                                                  |
| Licence      | CC BY 4.0                                                                                                                                                                                                                                           |

The French Community's houses come from the 20 October 2026 snapshots for now: since
maisonsdejustice.be was redesigned, it no longer lists them on a page, so they stay as they were
until a new source is found ([#125](https://github.com/pieterjanscheir/belgica/issues/125)).

Not in the data yet: the German-speaking Community's house of justice in Eupen
([#3](https://github.com/pieterjanscheir/belgica/issues/3)). Brussels has both a Flemish
(`justitiehuis-brussel`) and a French-speaking house (`maison-justice-bruxelles`).

## Fields

| Field                  | Type                                    | Description                                                                                                                  |
| ---------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `HouseOfJusticeId`                      | From the name, without articles: `justitiehuis-gent`, `maison-justice-arlon`                                                 |
| `validFrom`, `validTo` | string?                                 | The days the record applies, as the site listed it; none: since the coverage starts, or still applies. See [time](/api#time) |
| `community`            | `'flemish'` \| `'french'` \| `'german'` | The Community that runs it                                                                                                   |
| `name`                 | `{ nl }` or `{ fr }`                    | In the Community's language                                                                                                  |
| `ovo`                  | string?                                 | OVO number in the Flemish organisation register, for the Flemish houses: `OVO001917`                                         |
| `address`              | `Address`                               | With the municipality its postal code belongs to (`municipality`, by REFNIS code)                                            |
| `contacts`             | `Contact[]`                             | Phone, fax and e-mail; the victims' service of a French-speaking house has its own, labelled contacts                        |
| `website`              | `{ nl }` or `{ fr }`                    | The page it's listed on                                                                                                      |
| `sources`              | `{ url, retrieved }[]`                  | The pages the record was read from                                                                                           |

```ts
import { getHouseOfJustice, getContact } from 'belgica/houses-of-justice'

getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
getContact(getHouseOfJustice('maison-justice-arlon'), 'email', "service d'accueil des victimes")
```
