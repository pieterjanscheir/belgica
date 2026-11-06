---
layout: home

hero:
    name: belgica
    text: Données juridiques belges de référence
    tagline: Cours et tribunaux, cantons judiciaires et arrondissements, communes, et les taux de l'intérêt légal et des transactions commerciales. En JSON, avec types TypeScript et helpers.
    actions:
        - theme: brand
          text: Premiers pas
          link: /fr/guide/getting-started
        - theme: alt
          text: Trouver la juridiction
          link: /fr/guide/court-finder
        - theme: alt
          text: Taux d'intérêt
          link: /fr/data/interest-rates

features:
    - title: Sources documentées
      details: Chaque jeu de données indique d'où il provient, de l'annexe au Code judiciaire à Statbel et au Moniteur belge.
    - title: Territoire complet
      details: Les 162 cantons judiciaires avec les communes qu'ils couvrent, y compris le texte légal pour les villes scindées en plusieurs cantons.
    - title: Taux d'intérêt depuis 1970
      details: Le taux légal par année et le taux des transactions commerciales par semestre, avec la règle 2013–2015 de la date du contrat intégrée.
    - title: Pas seulement pour JavaScript
      details: Les fichiers JSON dans data/ sont la source de vérité. Lisez-les depuis Python ou n'importe quel autre langage, épinglés à un tag de release.
---

## En un coup d'œil {#at-a-glance}

<DataStats />

```ts
import { getCantonsForMunicipality, getInterestRate } from 'belgica'

getCantonsForMunicipality('44088') // [Canton merelbeke-melle]
getInterestRate('2024-06-15', 'legal') // { rate: 5.75, period: { from: '2024-01-01', to: '2024-12-31' } }
```

::: warning Données de référence, pas un avis juridique
Vérifiez les sources officielles avant de vous y fier.
:::
