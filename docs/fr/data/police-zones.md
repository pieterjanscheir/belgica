# Zones de police {#police-zones}

Fichier : `data/police-zones.json`. Les 175 zones de police (politiezones, zones de police,
Polizeizonen), chacune avec son numéro officiel, ses noms en néerlandais, en français et en
allemand, son nom court et les communes qu'elle couvre. Chaque commune est dans exactement une
zone.

## À quoi ça sert {#why-it-s-useful}

- **Quelle zone s'occupe d'une commune.** Une plainte, une copie d'un procès-verbal (PV),
  contacter la police locale au sujet d'une affaire : `findPoliceZone('44021')` donne la zone de
  Gand.
- **D'un PV à une juridiction.** Les affaires de roulage commencent par le PV d'une zone et vont
  au [tribunal de police](./courts) de l'arrondissement ; la commune relie les deux.
- **Le numéro de zone.** Le numéro à quatre chiffres (`5415` pour Gand) est le code qu'utilisent
  la police fédérale et les zones elles-mêmes, sur les PV et dans d'autres jeux de données.

## Source et mises à jour {#source-and-updates}

|               |                                                                                                                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source        | SPF Finances (AGDP), [Zones de police](https://opendata.fin.belgium.be/download/ATOM/6bcbdf8f-e89f-11ec-be04-9453308970f2-fr.xml) : les zones telles que les arrêtés royaux du 28 avril 2000 les fixent. Un shapefile zippé par date de référence ; le build lit ses deux tables attributaires |
| Construit par | `scripts/parse/police-zones.ts` à partir des snapshots. Le build échoue quand une commune n'est dans aucune zone ou dans deux, qu'une zone ne couvre aucune commune, ou qu'un code REFNIS n'est pas dans `municipalities.json`                                                                 |
| Change quand  | Des zones fusionnent ou se scindent (par arrêté royal), ou des communes fusionnent                                                                                                                                                                                                             |
| Couvre        | À partir du 2 novembre 2026, le jour où le jeu de données a été lu pour la première fois : une recherche pour un jour antérieur lève une `RangeError` ([temps](/fr/api#time))                                                                                                                  |
| Vérifié       | Deux fois par semaine, par le [workflow des sources](/fr/guide/data-quality#how-the-data-is-built)                                                                                                                                                                                             |
| Licence       | © SPF Finances (AGDP), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr)                                                                                                                                                                                                        |

Les noms sont tels que la source les écrit : en capitales, les communes que la zone couvre,
séparées par `/` (`AARTSELAAR/EDEGEM/HOVE/KONTICH/LINT`), et un nom court (`alias`) sous lequel la
zone est connue (`HESBAYE`, `REGIO PUYENBROECK`). Ils sont gardés tels que publiés, sans être
réécrits à la main.

## Champs {#fields}

| Champ                  | Type               | Description                                                                                                                  |
| ---------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PoliceZoneId`     | Le numéro officiel de la zone, p. ex. `5415`. Voir [identifiants](/fr/guide/identifiers)                                     |
| `validFrom`, `validTo` | string?            | Les jours où la zone s'applique ; aucun : depuis le début de la couverture, ou s'applique encore. Voir [temps](/fr/api#time) |
| `name`                 | `{ nl, fr, de }`   | Le nom officiel par langue, tel que publié : les communes que la zone couvre, en capitales                                   |
| `alias`                | string?            | Le nom court sous lequel la zone est connue, en capitales                                                                    |
| `municipalities`       | `MunicipalityId[]` | Les communes qu'elle couvre, par code REFNIS, dans l'ordre                                                                   |
| `sources`              | `SourceRef[]`      | Le fichier dont elle a été lue, et le jour où elle a été lue pour la première fois sous cette forme                          |

```ts
interface PoliceZone {
    id: PoliceZoneId // '5415'
    validFrom?: string
    validTo?: string
    name: { nl: string; fr: string; de: string } // { nl: 'GENT', fr: 'GAND', de: 'GENT' }
    alias?: string // 'GENT'
    municipalities: MunicipalityId[] // ['44021']
    sources: SourceRef[]
}
```

## Ce qui n'y est pas {#what-isn-t-in-it}

- **Les adresses et les contacts.** Les bureaux, numéros de téléphone et sites web des zones sont
  sur police.be, qui refuse les connexions depuis les serveurs de GitHub
  ([#52](https://github.com/pieterjanscheir/belgica/issues/52)) : ils ne sont donc pas encore lus.
- **Les limites.** La source a la géométrie de chaque zone, mais une zone est la somme de ses
  communes : les données renvoient donc à ces communes plutôt que de copier une seconde carte.
- **La police fédérale** (les directions judiciaires par arrondissement, PJF / FGP).

## Helpers {#helpers}

Chacun est décrit, avec ses résultats et ses erreurs, dans la
[référence de l'API](/fr/api#police-zones).

```ts
import { findPoliceZone, getPoliceZone, getPoliceZoneMunicipalities } from 'belgica/police-zones'

findPoliceZone('44021')?.id // '5415' : Gand
getPoliceZone('5403').alias // 'RODE'
getPoliceZoneMunicipalities('5349').map((m) => m.name.nl) // ['Aartselaar', 'Edegem', …]
```
