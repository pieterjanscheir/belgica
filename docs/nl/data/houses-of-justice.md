<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Justitiehuizen {#houses-of-justice}

Bestand: `data/houses-of-justice.json`. De justitiehuizen (maisons de justice) van de Vlaamse
en de Franse Gemeenschap: {{ stats.housesOfJustice }} records.

Justitiehuizen begeleiden en volgen daders op in opdracht van de rechtbanken en parketten
(probatie, elektronisch toezicht, werkstraf), onthalen slachtoffers en schrijven
maatschappelijke onderzoeken voor de familierechtbanken. Sinds 2015 worden ze door de
Gemeenschappen beheerd.

## Waarvoor het dient {#why-it-s-useful}

- **Familierecht.** Een familierechtbank beveelt een maatschappelijk onderzoek door het
  justitiehuis van het gebied van het gezin; advocaten en partijen hebben zijn
  contactgegevens nodig.
- **Strafrecht.** Probatievoorwaarden, alternatieve straffen en elektronisch toezicht worden
  opgevolgd door het justitiehuis; het slachtofferonthaal ook.
- **Koppelen.** De Vlaamse justitiehuizen dragen hun OVO-nummer, de identifier in het Vlaamse
  organisatieregister ([Wegwijs](https://wegwijs.vlaanderen.be)), zodat de data aan andere
  data van de Vlaamse overheid te koppelen is.

## Bron en updates {#source-and-updates}

|               |                                                                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bron          | [vlaanderen.be: Justitiehuizen](https://www.vlaanderen.be/agentschap-justitie-en-handhaving/justitie/justitiehuizen) (Vlaamse Gemeenschap) en [maisonsdejustice.be](https://www.maisonsdejustice.be/menu-de-droite/trouverunemj/) (Franse Gemeenschap) |
| Gebouwd door  | `scripts/parse`, uit de snapshots                                                                                                                                                                                                                      |
| Gecontroleerd | Twee keer per week, door de [sources-workflow](/nl/guide/data-quality#how-the-data-is-built)                                                                                                                                                           |

De justitiehuizen van de Franse Gemeenschap komen voorlopig uit de snapshots van 20 oktober
2026: sinds de nieuwe site van maisonsdejustice.be staan ze niet meer op een pagina, dus blijven ze
zoals ze waren tot er een nieuwe bron is ([#125](https://github.com/pieterjanscheir/belgica/issues/125)).

Nog niet in de data: het justitiehuis van de Duitstalige Gemeenschap in Eupen
([#3](https://github.com/pieterjanscheir/belgica/issues/3)). Brussel heeft zowel een
Vlaams (`justitiehuis-brussel`) als een Franstalig justitiehuis (`maison-justice-bruxelles`).

## Velden {#fields}

| Veld                   | Type                                    | Beschrijving                                                                                                                                       |
| ---------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `HouseOfJusticeId`                      | Uit de naam, zonder lidwoorden: `justitiehuis-gent`, `maison-justice-arlon`                                                                        |
| `validFrom`, `validTo` | string?                                 | De dagen waarop het record geldt, zoals de site het vermeldde; geen: sinds het begin van de dekking, of geldt nog steeds. Zie [tijd](/nl/api#time) |
| `community`            | `'flemish'` \| `'french'` \| `'german'` | De Gemeenschap die het beheert                                                                                                                     |
| `name`                 | `{ nl }` of `{ fr }`                    | In de taal van de Gemeenschap                                                                                                                      |
| `ovo`                  | string?                                 | OVO-nummer in het Vlaamse organisatieregister, voor de Vlaamse justitiehuizen: `OVO001917`                                                         |
| `address`              | `Address`                               | Met de gemeente waartoe de postcode behoort (`municipality`, op REFNIS-code)                                                                       |
| `contacts`             | `Contact[]`                             | Telefoon, fax en e-mail; de dienst slachtofferonthaal van een Franstalig justitiehuis heeft eigen, gelabelde contactgegevens                       |
| `website`              | `{ nl }` of `{ fr }`                    | De pagina waarop het vermeld staat                                                                                                                 |
| `sources`              | `{ url, retrieved }[]`                  | De pagina's waaruit het record is gelezen                                                                                                          |

```ts
import { getHouseOfJustice, getContact } from 'belgica/houses-of-justice'

getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
getContact(getHouseOfJustice('maison-justice-arlon'), 'email', "service d'accueil des victimes")
```
