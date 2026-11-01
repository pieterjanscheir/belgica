# Postcodes {#postal-codes}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

Bestand: `data/postal-codes.json`. De {{ stats.postalCodes.codes }} Belgische postcodes, elk
gekoppeld aan de gemeente waartoe ze behoren, op REFNIS-code: {{ stats.postalCodes.records }}
records, omdat {{ stats.postalCodes.shared }} postcodes bij twee gemeenten horen.

## Waarvoor het dient {#why-it-s-useful}

- **Van een adres naar de gerechtelijke kaart.** Adressen komen met een postcode, niet met een
  REFNIS-code. De postcode geeft de gemeente, en de gemeente geeft haar kantons en gerechten:
  `findCourtsForPostalCode('9050', 'labour-court')` beantwoordt "welk gerecht voor dit adres?"
  zover de postcode dat kan.
- **De postcodes van een gemeente.** Een formulier valideren, een mailing adresseren, nagaan of
  een adres en een REFNIS-code overeenstemmen: `getPostalCodes('44021')`.
- **De gemeente van elk gerecht, elke gevangenis en elk justitiehuis.** Hun
  `address.municipality` is deze koppeling, toegepast op de postcode van het gepubliceerde adres
  ([#28](https://github.com/pieterjanscheir/belgica/issues/28)).

## Bron en updates {#source-and-updates}

|               |                                                                                                                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bron          | De [conversietabel van postcodes naar REFNIS-codes](https://statbel.fgov.be/nl/over-statbel/methodologie/classificaties/geografie) van Statbel, de tabel die geldt vanaf 1 januari 2025 (`…_va01012025.xlsx`)                                             |
| Gebouwd door  | `scripts/parse/postal-codes.ts`, uit de snapshots. De build faalt wanneer een postcode naar een REFNIS-code wijst die niet in `municipalities.json` staat, of een gemeente geen postcode heeft                                                            |
| Verandert bij | Statbel een nieuwe tabel publiceert: gemeenten fuseren, bpost voegt een postcode toe of schaft er een af                                                                                                                                                  |
| Dekt          | 1 januari 2025 en later: opzoekingen voor een vroegere dag gooien een `RangeError` ([tijd](/nl/api#time)). Een latere tabel geeft de paren die ze laat vallen een `validTo` en de paren die ze toevoegt een `validFrom`, op de dag waarop de tabel ingaat |
| Gecontroleerd | Twee keer per week, door de [sources-workflow](/nl/guide/data-quality#how-the-data-is-built)                                                                                                                                                              |
| Licentie      | © Statbel, [CC BY 4.0](https://statbel.fgov.be/en/cc-40)                                                                                                                                                                                                  |

Statbel bouwt de tabel uit de postkantoren van bpost en de gemeenten van de FOD Financiën. Ze
bevat ook een gemeentenaam per rij, die hier niet wordt bewaard: die wijkt op enkele plaatsen af
van Statbels eigen REFNIS-lijst (`Tongeren-Borgloon` waar de lijst `Tongres-Looz` zegt, en
`Saint-Nicolas` voor Sint-Niklaas), en een record verwijst naar zijn gemeente in plaats van haar
te kopiëren. `getMunicipality(record.municipality).name` heeft de namen.

## Gedeelde postcodes {#shared-postal-codes}

Een gemeente heeft meerdere postcodes (Gent heeft er tien), en een postcode hoort bij één
gemeente, op drie uitzonderingen na:

| Postcode | Gemeenten                                        |
| -------- | ------------------------------------------------ |
| `1040`   | Brussel (`21004`) en Etterbeek (`21005`)         |
| `1050`   | Brussel (`21004`) en Elsene (`21009`)            |
| `1804`   | Vilvoorde (`23088`) en Zemst (`23096`): Cargovil |

Daar beslist de straat. `getMunicipalitiesForPostalCode` geeft beide gemeenten terug, en
`findCourtsForPostalCode` antwoordt per gemeente, zodat een gedeelde code nooit stilzwijgend tot
een van beide wordt herleid.

## Velden {#fields}

| Veld                   | Type             | Beschrijving                                                                                                                                                                  |
| ---------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PostalCodeId`   | De postcode en de REFNIS-code, aan elkaar: `9000-44021`. Geen van beide benoemt alleen een record; samen zijn ze officieel én uniek. Zie [identifiers](/nl/guide/identifiers) |
| `validFrom`, `validTo` | string?          | De dagen waarop het paar geldt, zoals de tabellen van Statbel ze geven; geen: sinds het begin van de dekking, of geldt nog. Zie [tijd](/nl/api#time)                          |
| `postalCode`           | string           | De postcode van vier cijfers                                                                                                                                                  |
| `municipality`         | `MunicipalityId` | De gemeente waartoe de postcode behoort, op REFNIS-code                                                                                                                       |

```ts
interface PostalCode {
    id: PostalCodeId // '9000-44021'
    validFrom?: string
    validTo?: string
    postalCode: string // '9000'
    municipality: MunicipalityId // '44021'
}
```

## Wat er niet in zit {#what-isn-t-in-it}

- **Deelgemeenten**: de tabel van Statbel stopt bij de gemeente. De eigen postcodelijst van
  bpost noemt de deelgemeenten, maar bevat geen REFNIS-code en is gepubliceerd onder de
  gebruiksvoorwaarden van bpost (alle rechten voorbehouden), geen open licentie, dus ze wordt
  niet gebruikt.
- **De straat.** In een stad die over kantons gesplitst is (Antwerpen, Gent, Brussel, Luik, …)
  geeft de postcode de gemeente, en de gemeente meerdere kantons; dan beslist de straat, en de
  grenzen bestaan alleen als juridisch proza in de `territory` van elk kanton tot
  [#29](https://github.com/pieterjanscheir/belgica/issues/29) ze als geometrie toevoegt.

## Helpers {#helpers}

```ts
import { getMunicipalitiesForPostalCode, getPostalCodes } from 'belgica/postal-codes'
import { findCourtsForPostalCode } from 'belgica'

getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]

// Per gemeente: haar vredegerechten, en haar gerechten van het gevraagde type
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: Gent, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]
```
