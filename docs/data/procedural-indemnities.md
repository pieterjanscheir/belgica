# Procedural indemnity

File: `data/procedural-indemnities.json`. Source: the KB of 26 October 2007 and its indexations.
Entry point: `belgica/procedural-indemnities`.

## Why it's useful

The party that loses pays the party that wins a fixed contribution to its lawyer's fees: the
procedural indemnity (rechtsplegingsvergoeding, indemnité de procédure, art. 1022 Judicial Code).
Every cost estimate and every judgment's costs need it. The amount depends on three things:

- **The tariff.** The general tariff (art. 2 and 3 of the KB) applies before every court. The
  proceedings of art. 579 and 1017, second paragraph, Judicial Code (occupational accidents and
  diseases, social security) have three lower tariffs of their own (art. 4): before the
  president of the labour court, the labour court and the labour court of appeal.
- **The value of the claim.** Each tariff has brackets, each with a minimum, a base and a
  maximum amount, and separate amounts for a claim that can't be valued in money.
- **The day**, usually the day of the judgment: the amounts are indexed when the consumer price
  index moves 10 points (art. 8).

**The judge decides.** The base amount is what the judge awards unless a party asks for more
or less; the judge can set it anywhere between the minimum and the maximum, with reasons. These
functions give the three amounts, not the judge's choice.

## Source and updates

|              |                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | [KB van 26 oktober 2007](https://www.ejustice.just.fgov.be/eli/besluit/2007/10/26/2007009900/justel), art. 2 to 4 and 8, as amended by the KB of 16 May 2024 (BS 5 June 2024); the amounts the [College van de hoven en rechtbanken](https://www.rechtbanken-tribunaux.be/sites/default/files/media/tarifs/bedrag-van-de-rechtsplegingsvergoeding.pdf) publishes check the result |
| Built by     | Hand: the amounts of the KB, and an indexation when one takes effect                                                                                                                                                                                                                                                                                                              |
| Changes when | The consumer price index (base 2004) reaches a threshold of 105.78 plus a multiple of 10: the next is 175.78                                                                                                                                                                                                                                                                      |
| Covers       | From 1 January 2008, when the KB came into force: the functions return `null` for an earlier day                                                                                                                                                                                                                                                                                  |
| Licence      | CC BY 4.0                                                                                                                                                                                                                                                                                                                                                                         |

The file holds the amounts **as the KB sets them**, not indexed, and the list of indexations.
The functions index them for a day. The tests check the result against the table the College
van de hoven en rechtbanken published for 1 March 2025, to the cent, for every bracket of every
tariff.

## Indexation

Art. 8 links the amounts to the consumer price index of March 2007: 105.78 points (base 2004).
Each indexation takes effect on the first day of the month after the index reached a new
threshold, 10 points above or below the last one. How the amounts are indexed changed in 2024:

| From         | Threshold | Method                                                           | Amounts of the KB times |
| ------------ | --------- | ---------------------------------------------------------------- | ----------------------- |
| 1 Jan 2008   | 105.78    | `steps`                                                          | 1                       |
| 1 March 2011 | 115.78    | `steps`: 10 % more for every 10 points                           | 1.1                     |
| 1 June 2016  | 125.78    | `steps`                                                          | 1.2                     |
| 1 June 2021  | 135.78    | `steps`                                                          | 1.3                     |
| 1 April 2022 | 145.78    | `steps`                                                          | 1.4                     |
| 1 Nov 2022   | 155.78    | `steps`                                                          | 1.5                     |
| 1 March 2025 | 165.78    | `formula`: the index of February 2025, 166.05, divided by 105.78 | 1.5697…                 |

Since the KB of 16 May 2024 (in force on 6 June 2024), an indexed amount is the amount of the
KB times the new index, divided by the start index, rounded to the cent. Its transitional
provision set the first indexation under the new rule at the index of 145.78 or 165.78: the
index of February 2025 reached 165.78.

Every amount is rounded to the cent, half a cent up. `indexProceduralIndemnity` computes in
whole cents, so no floating-point error creeps in.

## Look up an amount

```ts
import { getProceduralIndemnity, getProceduralIndemnityTable } from 'belgica/procedural-indemnities'

getProceduralIndemnity(10_000, '2026-01-15')
// { tariff: 'general', bracket: { above: 5000, upTo: 10000 },
//   min: 784.88, base: 1412.79, max: 3139.53, indexation: { from: '2025-03-01', … } }

getProceduralIndemnity(null, '2026-01-15') // a claim that can't be valued in money
// { tariff: 'general', bracket: null, min: 117.73, base: 1883.72, max: 15697.67, … }

getProceduralIndemnity(1800, '2026-01-15', { tariff: 'labour-court' })
// { tariff: 'labour-court', bracket: { above: 619.99, upTo: 2500 }, min: 140.21, base: 171.61, max: 203, … }

getProceduralIndemnityTable('2026-01-15') // every bracket of the general tariff, indexed
```

A bracket includes its upper limit: a claim of exactly € 250 is in the first bracket of the
general tariff. For a claim that is only partly valued in money, ask for both (the amount, and
`null`) and compare: which applies is for the judge to decide.

## Shape

```ts
type ProceduralIndemnityTariffId =
    'general' | 'labour-court-president' | 'labour-court' | 'labour-court-of-appeal'

interface ProceduralIndemnities {
    description: string
    legalBasis: string
    startIndex: number // 105.78
    tariffs: ProceduralIndemnityTariff[]
    indexations: ProceduralIndemnityIndexation[] // oldest first
}

interface ProceduralIndemnityTariff {
    id: ProceduralIndemnityTariffId
    name: { nl: string; fr: string; de: string }
    article: string // 'art. 2 en 3', 'art. 4'
    brackets: { upTo: number | null; min: number; base: number; max: number }[] // as in the KB
    nonMonetary: { min: number; base: number; max: number }
}

type ProceduralIndemnityIndexation =
    | { from: string; method: 'steps'; threshold: number; multiplier: number; note?: string }
    | { from: string; method: 'formula'; threshold: number; index: number; note?: string }
```

## Not in it yet

- **A warning when an indexation is due.** The next one comes when the index reaches 175.78.
  Until the freshness check watches Statbel's index
  ([#60](https://github.com/pieterjanscheir/belgica/issues/60)), it's added by hand.
- **The rules that depend on the case**, such as a defendant who pays before or after the case
  is enrolled (art. 1 of the KB): the functions give the tariff, not the outcome of a case.
