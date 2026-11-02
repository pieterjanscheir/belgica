# Politiezones {#police-zones}

Bestand: `data/police-zones.json`. De 175 politiezones (politiezones, zones de police,
Polizeizonen), elk met zijn officiële nummer, zijn namen in het Nederlands, Frans en Duits, zijn
korte naam en de gemeenten die het dekt. Elke gemeente ligt in precies één zone.

## Waarvoor het dient {#why-it-s-useful}

- **Welke zone een gemeente behandelt.** Klachten, een kopie van een proces-verbaal (pv), de
  lokale politie contacteren over een zaak: `findPoliceZone('44021')` geeft de zone van Gent.
- **Van een pv naar een gerecht.** Verkeerszaken beginnen met een pv van een zone en gaan naar
  de [politierechtbank](./courts) van het arrondissement; de gemeente verbindt beide.
- **Het zonenummer.** Het nummer van vier cijfers (`5415` voor Gent) is de code die de federale
  politie en de zones zelf gebruiken, op pv's en in andere datasets.

## Bron en updates {#source-and-updates}

|                   |                                                                                                                                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bron              | FOD Financiën (AAPD), [Politiezones](https://opendata.fin.belgium.be/download/ATOM/6bcbdf8f-e89f-11ec-be04-9453308970f2-nl.xml): de zones zoals de koninklijke besluiten van 28 april 2000 ze vastleggen. Een gezipte shapefile per referentiedatum; de build leest de twee attribuuttabellen |
| Gebouwd door      | `scripts/parse/police-zones.ts`, uit de snapshots. De build faalt wanneer een gemeente in geen of in twee zones ligt, een zone geen gemeente dekt, of een REFNIS-code niet in `municipalities.json` staat                                                                                     |
| Verandert wanneer | Zones fuseren of splitsen (bij koninklijk besluit), of gemeenten fuseren                                                                                                                                                                                                                      |
| Dekt              | 2 november 2026 en later, de dag waarop de dataset voor het eerst gelezen werd: opzoekingen voor een vroegere dag gooien een `RangeError` ([tijd](/nl/api#time))                                                                                                                              |
| Gecontroleerd     | Twee keer per week, door de [sources-workflow](/nl/guide/data-quality#how-the-data-is-built)                                                                                                                                                                                                  |
| Licentie          | © FOD Financiën (AAPD), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.nl)                                                                                                                                                                                                      |

De namen staan er zoals de bron ze schrijft: in hoofdletters, de gemeenten die de zone dekt,
gescheiden door `/` (`AARTSELAAR/EDEGEM/HOVE/KONTICH/LINT`), en een korte naam (`alias`) waaronder
de zone bekendstaat (`HESBAYE`, `REGIO PUYENBROECK`). Ze worden bewaard zoals gepubliceerd, niet
met de hand herschreven.

## Velden {#fields}

| Veld                   | Type               | Beschrijving                                                                                                |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `id`                   | `PoliceZoneId`     | Het officiële nummer van de zone, bv. `5415`. Zie [identifiers](/nl/guide/identifiers)                      |
| `validFrom`, `validTo` | string?            | De dagen waarop de zone geldt; geen: sinds het begin van de dekking, of geldt nog. Zie [tijd](/nl/api#time) |
| `name`                 | `{ nl, fr, de }`   | De officiële naam per taal, zoals gepubliceerd: de gemeenten die de zone dekt, in hoofdletters              |
| `alias`                | string?            | De korte naam waaronder de zone bekendstaat, in hoofdletters                                                |
| `municipalities`       | `MunicipalityId[]` | De gemeenten die de zone dekt, op REFNIS-code, in volgorde                                                  |
| `sources`              | `SourceRef[]`      | Het bestand waaruit het gelezen werd, en de dag waarop het voor het eerst in deze vorm gelezen werd         |

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

## Wat er niet in zit {#what-isn-t-in-it}

- **Adressen en contactgegevens.** De kantoren, telefoonnummers en websites van de zones staan op
  police.be, dat verbindingen van de servers van GitHub weigert
  ([#52](https://github.com/pieterjanscheir/belgica/issues/52)), dus worden ze nog niet gelezen.
- **De grenzen.** De bron heeft de geometrie van elke zone, maar een zone is de som van haar
  gemeenten, dus verwijst de data naar die gemeenten in plaats van een tweede kaart te kopiëren.
- **De federale politie** (de gerechtelijke directies per arrondissement, FGP / PJF).

## Helpers {#helpers}

Elk ervan wordt, met zijn resultaten en fouten, beschreven in de
[API-referentie](/nl/api#police-zones).

```ts
import { findPoliceZone, getPoliceZone, getPoliceZoneMunicipalities } from 'belgica/police-zones'

findPoliceZone('44021')?.id // '5415': Gent
getPoliceZone('5403').alias // 'RODE'
getPoliceZoneMunicipalities('5349').map((m) => m.name.nl) // ['Aartselaar', 'Edegem', …]
```
