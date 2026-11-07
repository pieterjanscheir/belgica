---
layout: home

hero:
    name: belgica
    text: Belgische juridische referentiedata
    tagline: Hoven en rechtbanken, gerechtelijke kantons en arrondissementen, gemeenten, en de wettelijke rentevoet en die voor handelstransacties. JSON, met TypeScript-types en helpers.
    actions:
        - theme: brand
          text: Aan de slag
          link: /nl/guide/getting-started
        - theme: alt
          text: Zoek de rechtbank
          link: /nl/guide/court-finder
        - theme: alt
          text: Rentevoeten
          link: /nl/data/interest-rates

features:
    - title: Met bronvermelding
      details: Elke dataset vermeldt waar ze vandaan komt, van het bijvoegsel bij het Gerechtelijk Wetboek tot Statbel en het Belgisch Staatsblad.
    - title: Volledig territorium
      details: Alle 162 gerechtelijke kantons met de gemeenten die ze bestrijken, inclusief de wettekst voor steden die over meerdere kantons gesplitst zijn.
    - title: Rentevoeten sinds 1970
      details: De wettelijke rentevoet per jaar en de rentevoet voor handelstransacties per semester, met de contractdatumregel van 2013–2015 ingebouwd.
    - title: Niet alleen voor JavaScript
      details: De JSON-bestanden in data/ zijn de bron van waarheid. Lees ze vanuit Python of eender wat anders, vastgepind op een release-tag.
---

## In een oogopslag {#at-a-glance}

<DataStats />

```ts
import { getCantonsForMunicipality, getInterestRate } from 'belgica'

getCantonsForMunicipality('44088') // [Canton merelbeke-melle]
getInterestRate('2024-06-15', 'legal') // { rate: 5.75, period: { from: '2024-01-01', to: '2024-12-31' } }
```

::: warning Referentiedata, geen juridisch advies
Controleer de officiële bronnen voor je erop vertrouwt.
:::
