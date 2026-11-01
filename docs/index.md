---
layout: home

hero:
    name: belgica
    text: Belgian legal reference data
    tagline: Courts, jurisdiction, interest rates and holidays for legal software, from the official sources. For TypeScript, Python, or any language as JSON and CSV.
    actions:
        - theme: brand
          text: Get started
          link: /guide/getting-started
        - theme: alt
          text: Common tasks
          link: /guide/common-tasks
        - theme: alt
          text: Browse the data
          link: /data/

features:
    - title: Courts and jurisdiction
      details: Every court, division and seat on the courts' portal, with names as published, addresses and each registry's contacts. Which court has jurisdiction over a municipality, a postal code or a point on the map.
      link: /data/courts
      linkText: Courts
    - title: The judicial map
      details: All 162 judicial cantons with the municipalities they cover and the law's text for split cities, the arrondissements, REFNIS codes, postal codes and the NGI's boundaries.
      link: /data/territory
      linkText: Territory and cantons
    - title: Rates and deadlines
      details: The legal interest rate since 1970 and the commercial rate since 2002, with the 2013–2015 contract rule. The public holidays of any year, and the next working day under art. 53 of the Judicial Code.
      link: /data/interest-rates
      linkText: Interest rates
    - title: Sourced and kept current
      details: Every dataset names its official source and every scraped record the page it was read from. The sources are fetched twice a week, and changes are reviewed before they're merged.
      link: /guide/data-quality
      linkText: Data quality
    - title: Typed and dated
      details: Generated id types, zod schemas and JSON Schemas. Every record has a validity period and every lookup answers for a day, so a question about last year gets last year's answer.
      link: /guide/concepts
      linkText: Core concepts
    - title: Not just for JavaScript
      details: The same data and lookups on PyPI, and every dataset as JSON and CSV in each release, with a Frictionless data package descriptor.
      link: /guide/raw-json
      linkText: Without JavaScript
---

## At a glance

```ts
import { findCourtsWithJurisdiction, findJusticesOfThePeace, getInterestRate } from 'belgica'

findJusticesOfThePeace('44088')[0].court.id // 'justice-of-the-peace-merelbeke-melle'
findCourtsWithJurisdiction('23088', 'police-court')[0].id // 'police-court-vilvoorde'
getInterestRate('2024-06-15', 'legal') // { rate: 5.75, period: { from: '2024-01-01', to: '2024-12-31' } }
```

<DataStats />

::: warning Reference data, not legal advice
The data is checked against official sources, but sources change and mistakes happen. Check the
source before relying on a value where it matters.
:::
