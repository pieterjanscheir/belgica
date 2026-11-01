# Gevangenissen {#prisons}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

Bestand: `data/prisons.json`. De {{ stats.prisons }} gevangenissen en detentiehuizen van de FOD Justitie
(Directoraat-generaal Penitentiaire Inrichtingen).

## Waarvoor het dient {#why-it-s-useful}

- **Schrijven naar een gedetineerde of zijn gevangenis.** Advocaten, families en diensten
  hebben het adres en telefoonnummer van de gevangenis nodig; de namen verschillen per taal
  (`Gevangenis van Bergen`, `Prison de Mons`, `Gefängnis Mons`).
- **Geld storten.** Waar de FOD Justitie de rekening van de gevangenis publiceert voor geld
  voor gedetineerden, staat die in de contactgegevens als `bank-account`, met gecontroleerde
  checksum.
- **Formulieren en dossiers.** Een stabiele id per inrichting om bij een dossier te bewaren,
  en een lijst om uit te kiezen.

## Bron en updates {#source-and-updates}

|               |                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bron          | [FOD Justitie: Belgische gevangenissen](https://justitie.belgium.be/nl/themas_en_dossiers/gevangenissen/belgische_gevangenissen), de pagina van elke gevangenis in het Nederlands, Frans en Duits |
| Gebouwd door  | `scripts/parse`, uit de snapshots                                                                                                                                                                 |
| Verandert bij | Een gevangenis die opent of sluit, of haar contactgegevens wijzigt                                                                                                                                |
| Gecontroleerd | Twee keer per week, door de [sources-workflow](/nl/guide/data-quality#how-the-data-is-built)                                                                                                      |

## Velden {#fields}

| Veld                   | Type                              | Beschrijving                                                                                                                                       |
| ---------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PrisonId`                        | Uit de naam in de streektaal, zonder lidwoorden: `gevangenis-gent`, `prison-lantin`, `detentiehuis-kortrijk`                                       |
| `validFrom`, `validTo` | string?                           | De dagen waarop het record geldt, zoals de site het vermeldde; geen: sinds het begin van de dekking, of geldt nog steeds. Zie [tijd](/nl/api#time) |
| `kind`                 | `'prison'` \| `'detention-house'` | Een detentiehuis huisvest mensen met korte straffen, dicht bij huis                                                                                |
| `name`                 | `{ nl, fr, de }`                  | Zoals de FOD Justitie die publiceert                                                                                                               |
| `address`              | `Address`                         | In de streektaal, met de gemeente waartoe de postcode behoort (`municipality`, op REFNIS-code)                                                     |
| `contacts`             | `Contact[]`                       | Telefoon, fax, e-mail en de rekening voor geld voor gedetineerden, waar gepubliceerd                                                               |
| `website`              | `{ nl, fr, de }`                  | De pagina van de gevangenis per taal                                                                                                               |
| `sources`              | `{ url, retrieved }[]`            | De pagina's waaruit het record is gelezen                                                                                                          |

De naam van de directeur, die de pagina's ook geven, is weggelaten: hij verandert, en het zijn
persoonsgegevens die het package niet nodig heeft.

```ts
import { getPrison, prisons } from 'belgica/prisons'

getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
prisons.filter((p) => p.kind === 'detention-house') // Kortrijk, Olen, Vorst
```
