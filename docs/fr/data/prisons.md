# Prisons {#prisons}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

Fichier : `data/prisons.json`. Les {{ stats.prisons }} prisons et maisons de détention du SPF Justice
(Direction générale des Établissements pénitentiaires).

## À quoi ça sert {#why-it-s-useful}

- **Écrire à un détenu ou à sa prison.** Avocats, familles et services ont besoin de l'adresse et du
  numéro de téléphone de la prison ; les noms diffèrent selon la langue (`Gevangenis van Bergen`,
  `Prison de Mons`, `Gefängnis Mons`).
- **Verser de l'argent.** Là où le SPF Justice publie le compte de la prison pour l'argent destiné aux
  détenus, il figure dans les coordonnées comme `bank-account`, somme de contrôle vérifiée.
- **Formulaires et dossiers.** Un identifiant stable par établissement à conserver avec un dossier, et
  une liste dans laquelle choisir.

## Source et mises à jour {#source-and-updates}

|               |                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source        | [SPF Justice : les prisons belges](https://justitie.belgium.be/nl/themas_en_dossiers/gevangenissen/belgische_gevangenissen), la page de chaque prison en néerlandais, en français et en allemand |
| Construit par | `scripts/parse` à partir des instantanés                                                                                                                                                         |
| Change quand  | Une prison ouvre ou ferme, ou change de coordonnées                                                                                                                                              |
| Vérifié       | Deux fois par semaine, par le [workflow des sources](/fr/guide/data-quality#how-the-data-is-built)                                                                                               |

## Champs {#fields}

| Champ                  | Type                              | Description                                                                                                                                                             |
| ---------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PrisonId`                        | D'après le nom dans la langue locale, sans article : `gevangenis-gent`, `prison-lantin`, `detentiehuis-kortrijk`                                                        |
| `validFrom`, `validTo` | string?                           | Les jours où l'enregistrement s'applique, tels que le site l'a recensé ; absents : depuis le début de la couverture, ou toujours en vigueur. Voir [temps](/fr/api#time) |
| `kind`                 | `'prison'` \| `'detention-house'` | Une maison de détention accueille des personnes condamnées à de courtes peines, près de chez elles                                                                      |
| `name`                 | `{ nl, fr, de }`                  | Tel que le SPF Justice le publie                                                                                                                                        |
| `address`              | `Address`                         | Dans la langue locale, avec la commune à laquelle le code postal appartient (`municipality`, par code REFNIS)                                                           |
| `contacts`             | `Contact[]`                       | Téléphone, fax, e-mail et le compte pour l'argent destiné aux détenus, lorsqu'il est publié                                                                             |
| `website`              | `{ nl, fr, de }`                  | La page de la prison par langue                                                                                                                                         |
| `sources`              | `{ url, retrieved }[]`            | Les pages dont l'enregistrement a été lu                                                                                                                                |

Le nom du directeur, que les pages donnent aussi, est laissé de côté : il change, et c'est une donnée à
caractère personnel dont le package n'a pas besoin.

```ts
import { getPrison, prisons } from 'belgica/prisons'

getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
prisons.filter((p) => p.kind === 'detention-house') // Kortrijk, Olen, Vorst
```
