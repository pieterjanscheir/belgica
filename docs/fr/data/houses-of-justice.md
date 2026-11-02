<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Maisons de justice {#houses-of-justice}

Fichier : `data/houses-of-justice.json`. Les maisons de justice (justitiehuizen, maisons de
justice) des Communautés flamande et française : {{ stats.housesOfJustice }} enregistrements.

Les maisons de justice guident et surveillent les justiciables pour le compte des cours,
tribunaux et parquets (probation, surveillance électronique, peine de travail), assurent
l'accueil des victimes et rédigent des études sociales pour les tribunaux de la famille. Les
Communautés les gèrent depuis 2015.

## À quoi ça sert {#why-it-s-useful}

- **Droit de la famille.** Le tribunal de la famille ordonne une étude sociale à la maison de
  justice du ressort de la famille ; les avocats et les parties ont besoin de ses coordonnées.
- **Droit pénal.** Les conditions de probation, les peines alternatives et la surveillance
  électronique sont suivies par la maison de justice ; l'accueil des victimes aussi.
- **Liaison.** Les maisons flamandes portent leur numéro OVO, l'identifiant dans le registre
  flamand des organisations ([Wegwijs](https://wegwijs.vlaanderen.be)), ce qui permet de joindre
  les données à d'autres données de l'administration flamande.

## Source et mises à jour {#source-and-updates}

|               |                                                                                                                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source        | [vlaanderen.be : Justitiehuizen](https://www.vlaanderen.be/agentschap-justitie-en-handhaving/justitie/justitiehuizen) (Communauté flamande) et [maisonsdejustice.be](https://www.maisonsdejustice.be/menu-de-droite/trouverunemj/) (Communauté française) |
| Construit par | `scripts/parse` à partir des instantanés                                                                                                                                                                                                                  |
| Vérifié       | Deux fois par semaine, par le [workflow des sources](/fr/guide/data-quality#how-the-data-is-built)                                                                                                                                                        |

Les maisons de justice de la Communauté française viennent pour l'instant des snapshots du
20 octobre 2026 : depuis la refonte de maisonsdejustice.be, elles ne sont plus listées sur une
page, elles restent donc telles quelles jusqu'à ce qu'une nouvelle source soit trouvée
([#125](https://github.com/pieterjanscheir/belgica/issues/125)).

Pas encore dans les données : la maison de justice de la Communauté germanophone à Eupen
([#3](https://github.com/pieterjanscheir/belgica/issues/3)). Bruxelles a à la fois une
maison flamande (`justitiehuis-brussel`) et une maison francophone (`maison-justice-bruxelles`).

## Champs {#fields}

| Champ                  | Type                                    | Description                                                                                                                                                             |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `HouseOfJusticeId`                      | Dérivé du nom, sans articles : `justitiehuis-gent`, `maison-justice-arlon`                                                                                              |
| `validFrom`, `validTo` | string?                                 | Les jours où l'enregistrement s'applique, tels que le site l'a recensé ; absents : depuis le début de la couverture, ou toujours en vigueur. Voir [temps](/fr/api#time) |
| `community`            | `'flemish'` \| `'french'` \| `'german'` | La Communauté qui la gère                                                                                                                                               |
| `name`                 | `{ nl }` ou `{ fr }`                    | Dans la langue de la Communauté                                                                                                                                         |
| `ovo`                  | string?                                 | Numéro OVO dans le registre flamand des organisations, pour les maisons flamandes : `OVO001917`                                                                         |
| `address`              | `Address`                               | Avec la commune à laquelle le code postal appartient (`municipality`, par code REFNIS)                                                                                  |
| `contacts`             | `Contact[]`                             | Téléphone, fax et e-mail ; le service d'accueil des victimes d'une maison francophone a ses propres contacts, libellés                                                  |
| `website`              | `{ nl }` ou `{ fr }`                    | La page où elle est répertoriée                                                                                                                                         |
| `sources`              | `{ url, retrieved }[]`                  | Les pages d'où l'enregistrement a été lu                                                                                                                                |

```ts
import { getHouseOfJustice, getContact } from 'belgica/houses-of-justice'

getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
getContact(getHouseOfJustice('maison-justice-arlon'), 'email', "service d'accueil des victimes")
```
