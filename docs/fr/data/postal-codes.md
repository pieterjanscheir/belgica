# Codes postaux {#postal-codes}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

Fichier : `data/postal-codes.json`. Les {{ stats.postalCodes.codes }} codes postaux belges, chacun
lié à la commune à laquelle il appartient, par code REFNIS : {{ stats.postalCodes.records }}
enregistrements, parce que {{ stats.postalCodes.shared }} codes postaux appartiennent à deux
communes.

## À quoi ça sert {#why-it-s-useful}

- **D'une adresse à la carte judiciaire.** Les adresses viennent avec un code postal, pas avec un
  code REFNIS. Le code postal donne la commune, et la commune donne ses cantons et ses
  juridictions : `findCourtsForPostalCode('9050', 'labour-court')` répond à « quel tribunal pour
  cette adresse ? » autant que le code postal le permet.
- **Les codes postaux d'une commune.** Valider un formulaire, adresser un envoi, vérifier qu'une
  adresse et un code REFNIS concordent : `getPostalCodes('44021')`.
- **La commune de chaque juridiction, prison et maison de justice.** Leur `address.municipality`
  est ce lien, appliqué au code postal de l'adresse publiée
  ([#28](https://github.com/pieterjanscheir/belgica/issues/28)).

## Source et mises à jour {#source-and-updates}

|               |                                                                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source        | La [table de conversion des codes postaux en codes REFNIS](https://statbel.fgov.be/nl/over-statbel/methodologie/classificaties/geografie) de Statbel, la table valable à partir du 1er janvier 2025 (`…_va01012025.xlsx`)                                       |
| Construit par | `scripts/parse/postal-codes.ts` à partir des instantanés. La construction échoue quand un code renvoie à un code REFNIS absent de `municipalities.json`, ou qu'une commune n'a aucun code                                                                       |
| Change quand  | Statbel publie une nouvelle table : des communes fusionnent, bpost crée ou supprime un code postal                                                                                                                                                              |
| Couvre        | Le 1er janvier 2025 et après : une recherche pour un jour antérieur lève une `RangeError` ([temps](/fr/api#time)). Une table ultérieure donne un `validTo` aux paires qu'elle abandonne et un `validFrom` aux paires qu'elle ajoute, au jour où elle s'applique |
| Vérifié       | Deux fois par semaine, par le [workflow des sources](/fr/guide/data-quality#how-the-data-is-built)                                                                                                                                                              |
| Licence       | © Statbel, [CC BY 4.0](https://statbel.fgov.be/en/cc-40)                                                                                                                                                                                                        |

Statbel construit la table à partir des bureaux de poste de bpost et des communes du SPF Finances.
Elle porte aussi un nom de commune par ligne, qui n'est pas conservé ici : il diffère par endroits
de la propre liste REFNIS de Statbel (`Tongeren-Borgloon` là où la liste dit `Tongres-Looz`, et
`Saint-Nicolas` pour Sint-Niklaas), et un enregistrement renvoie à sa commune plutôt que de la
copier. `getMunicipality(record.municipality).name` donne les noms.

## Codes postaux partagés {#shared-postal-codes}

Une commune a plusieurs codes postaux (Gand en a dix), et un code postal appartient à une seule
commune, à trois exceptions près :

| Code postal | Communes                                         |
| ----------- | ------------------------------------------------ |
| `1040`      | Bruxelles (`21004`) et Etterbeek (`21005`)       |
| `1050`      | Bruxelles (`21004`) et Ixelles (`21009`)         |
| `1804`      | Vilvorde (`23088`) et Zemst (`23096`) : Cargovil |

Là, c'est la rue qui tranche. `getMunicipalitiesForPostalCode` renvoie les deux communes, et
`findCourtsForPostalCode` répond par commune, de sorte qu'un code partagé n'est jamais ramené en
silence à l'une d'elles.

## Champs {#fields}

| Champ                  | Type             | Description                                                                                                                                                                                     |
| ---------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PostalCodeId`   | Le code postal et le code REFNIS, joints : `9000-44021`. Aucun des deux ne désigne seul un enregistrement ; ensemble, ils sont officiels et uniques. Voir [identifiants](/fr/guide/identifiers) |
| `validFrom`, `validTo` | string?          | Les jours où la paire s'applique, tels que les tables de Statbel les donnent ; absents : depuis le début de la couverture, ou toujours en vigueur. Voir [temps](/fr/api#time)                   |
| `postalCode`           | string           | Le code postal à quatre chiffres                                                                                                                                                                |
| `municipality`         | `MunicipalityId` | La commune à laquelle le code postal appartient, par code REFNIS                                                                                                                                |

```ts
interface PostalCode {
    id: PostalCodeId // '9000-44021'
    validFrom?: string
    validTo?: string
    postalCode: string // '9000'
    municipality: MunicipalityId // '44021'
}
```

## Ce qui n'y est pas {#what-isn-t-in-it}

- **Les sections de commune** (deelgemeenten) : la table de Statbel s'arrête à la commune. La
  propre liste de codes postaux de bpost nomme les localités, mais sans code REFNIS, et elle est
  publiée sous les conditions d'utilisation de bpost (tous droits réservés), pas sous une licence
  ouverte ; elle n'est donc pas utilisée.
- **La rue.** Dans une ville scindée en cantons (Anvers, Gand, Bruxelles, Liège, …), le code
  postal donne la commune, et la commune donne plusieurs cantons ; c'est alors la rue qui tranche,
  et les limites n'existent que sous forme de prose juridique dans le `territory` de chaque canton
  jusqu'à ce que [#29](https://github.com/pieterjanscheir/belgica/issues/29) les ajoute en
  géométrie.

## Helpers {#helpers}

```ts
import { getMunicipalitiesForPostalCode, getPostalCodes } from 'belgica/postal-codes'
import { findCourtsForPostalCode } from 'belgica'

getMunicipalitiesForPostalCode('9050').map((m) => m.name.fr) // ['Gand']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.fr) // ['Bruxelles', 'Etterbeek']
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]

// Par commune : ses justices de paix, et ses juridictions du type demandé
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: Gand, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]
```
