<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Vredegerecht',
    'police-court': 'Politierechtbank',
    'court-of-first-instance': 'Rechtbank van eerste aanleg',
    'enterprise-court': 'Ondernemingsrechtbank',
    'labour-court': 'Arbeidsrechtbank',
    'court-of-appeal': 'Hof van beroep',
    'labour-court-of-appeal': 'Arbeidshof',
    'court-of-assize': 'Hof van assisen',
}

const areas = {
    'justice-of-the-peace': 'Een kanton; Philippeville zetelt op twee plaatsen',
    'police-court': 'Een arrondissement (Brussel gesplitst per taal, Halle, Vilvoorde)',
    'court-of-first-instance': 'Een arrondissement (Brussel gesplitst per taal)',
    'enterprise-court': 'Een arrondissement, of het rechtsgebied van een hof van beroep',
    'labour-court': 'Een arrondissement, of het rechtsgebied van een hof van beroep',
    'court-of-appeal': 'Een rechtsgebied',
    'labour-court-of-appeal': 'Een rechtsgebied',
    'court-of-assize': 'Een provincie, of Brussel-Hoofdstad',
}
</script>

# Hoven en rechtbanken {#courts}

Bestand: `data/courts.json`. Elk gerecht van de rechterlijke orde dat het eigen portaal van de
hoven en rechtbanken, [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be),
vermeldt: {{ stats.courts.total }} records die vandaag gelden<span v-if="stats.courts.retired">, en
{{ stats.courts.retired }} beëindigde versies die het portaal niet meer vermeldt</span>. De cijfers op
deze pagina worden uit de data berekend wanneer de site gebouwd wordt.

<table>
<thead><tr><th>Soort</th><th style="text-align:right">Gerechten</th><th style="text-align:right">Afdelingen of zetels</th><th>Gebied</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

Niet op het portaal, dus nog niet hier: het Hof van Cassatie, het Grondwettelijk Hof en de Raad
van State, en de tuchtrechtbanken.

## Waarvoor het dient {#why-it-s-useful}

- **Documenten adresseren.** Dagvaardingen, verzoekschriften en conclusies noemen het gerecht
  zoals het zichzelf noemt; brieven en neerleggingen gaan naar de griffie (greffe) op haar
  adres.
- **De juiste griffie bereiken.** Grotere gerechten hebben een griffie per materie (burgerlijk,
  strafrechtelijk, familie, het rechtspersonenregister…), elk met een eigen telefoonnummer,
  e-mailadres en soms bankrekening. De data houdt ze uit elkaar, met het label dat het gerecht
  zelf gebruikt.
- **Rechten betalen.** Griffies die een bankrekening publiceren voor rolrechten en
  consignaties hebben die in de data, met gecontroleerde checksum.
- **Formulieren bouwen.** Een gerechtkiezer heeft een volledige lijst met stabiele ids nodig,
  gekoppeld aan kantons, arrondissementen en rechtsgebieden, en aan het gerecht waar een
  afdeling toe behoort.
- **Rechtspraak koppelen.** `ecli` geeft de code die de beslissingen van het gerecht dragen in
  hun European Case Law Identifier (`ECLI:BE:HBGNT:…`).

## Bron en updates {#source-and-updates}

|               |                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Bron          | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), het portaal van het College van hoven en rechtbanken           |
| Gebouwd door  | `scripts/parse`, uit snapshots van de pagina en de contactpagina van elk gerecht                                                 |
| Verandert bij | Een gerecht dat verhuist of zijn contactgegevens of uren wijzigt, of het portaal dat een gerecht toevoegt of hernoemt            |
| Gecontroleerd | Twee keer per week, door de [sources-workflow](/nl/guide/data-quality#how-the-data-is-built); wijzigingen komen als pull request |

Elk record somt de pagina's op waaruit het is gelezen en de dag waarop de inhoud van elke pagina
voor het eerst is gezien (`sources`). Contactgegevens veranderen vaker dan wat ook in dit
package: als het ertoe doet, controleer dan de pagina van het gerecht (`website`).

<CourtList />

## Velden {#fields}

| Veld               | Type                                  | Beschrijving                                                                                                                                                                                                           |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | Stabiele id: het `type`, dan de plaats in de taal van het gerecht: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. Zie [identifiers](/nl/guide/identifiers)                  |
| `validFrom`        | string?                               | Eerste dag waarop het record geldt, `YYYY-MM-DD`: de dag waarop het portaal het voor het eerst vermeldde. Geen: sinds het begin van de dekking                                                                         |
| `validTo`          | string?                               | Laatste dag waarop het record geldt: de dag vóór de controle die het niet meer op het portaal vond. Geen: geldt nog steeds                                                                                             |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                  |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | Het gerecht zelf, een van zijn afdelingen (afdeling, division, Abteilung), of een van de plaatsen waar een vredegerecht zetelt                                                                                         |
| `court`            | `CourtId`?                            | Voor een afdeling of zetel: het gerecht waar ze toe behoort                                                                                                                                                            |
| `name`             | `{ nl?, fr?, de? }`                   | De naam zoals het gerecht die publiceert, in elke taal waarin het een pagina heeft: `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                       |
| `judicialArea`     | `JudicialAreaId`                      | Het rechtsgebied                                                                                                                                                                                                       |
| `arrondissement`   | `ArrondissementId`?                   | Het arrondissement, voor een gerecht of afdeling waarvan het gebied één arrondissement is of erbinnen ligt                                                                                                             |
| `canton`           | `CantonId`?                           | Voor een vredegerecht: het kanton dat het bedient                                                                                                                                                                      |
| `cantons`          | `CantonId[]`?                         | Voor elk ander gerecht (niet zijn afdelingen): de kantons die het bestrijkt, zoals de bijlage bij het Gerechtelijk Wetboek (art. 3–5) en art. 114 van het Wetboek ze vastleggen                                        |
| `ecli`             | `string[]`?                           | De ECLI-codes van het gerecht, één per taal waarin het rechtspreekt; alleen codes die in gepubliceerde beslissingen voorkomen                                                                                          |
| `address`          | `Address`?                            | Waar de griffie is, met de gemeente waartoe de postcode behoort (`municipality`, op REFNIS-code). Ontbreekt als het gerecht geen enkel adres publiceert (een gerecht waarvan elke afdeling haar eigen adres heeft)     |
| `contacts`         | `Contact[]`                           | Telefoon, fax, e-mail en bankrekening, elk met de griffie waar het bij hoort (`label`) en de tekst die erbij gepubliceerd is (`note`)                                                                                  |
| `openingHours`     | string?                               | Openingsuren van de griffie in de OpenStreetMap-syntaxis [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours): `Mo-Fr 08:30-12:30,13:30-16:00`, alleen als de gepubliceerde tekst precies dat zegt |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | De openingsuren zoals gepubliceerd, per taal                                                                                                                                                                           |
| `website`          | `{ nl?, fr?, de? }`                   | De pagina van het gerecht op het portaal, per taal                                                                                                                                                                     |
| `sources`          | `{ url, retrieved }[]`                | De pagina's waaruit het record is gelezen, en wanneer hun inhoud voor het eerst is gezien                                                                                                                              |

::: tip Nieuwe soorten gerechten
`type` kan nieuwe waarden krijgen (het Hof van Cassatie, om te beginnen). Als je er een `switch`
op doet, hou dan een `default`-tak zodat een nieuw type je code niet breekt.
:::

## Vorm {#shape}

```ts
interface Court {
    id: CourtId
    validFrom?: string
    validTo?: string
    type: CourtType
    kind: 'court' | 'division' | 'seat'
    court?: CourtId
    name: Partial<Translated>
    judicialArea: JudicialAreaId
    arrondissement?: ArrondissementId
    canton?: CantonId
    cantons?: CantonId[]
    ecli?: string[]
    address?: Address
    contacts: Contact[]
    openingHours?: string
    openingHoursText?: Partial<Translated>
    website: Partial<Record<Locale, string>>
    sources: SourceRef[]
}

interface Address {
    building?: string
    street: string // zoals gepubliceerd, met nummer, bus of verdieping: 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // via de postcode; zie de pagina Postcodes
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // canoniek: E.164, e-mail in kleine letters, elektronisch IBAN
    label?: string // de griffie of dienst: 'Burgerlijke griffie', 'Greffe pénal'
    note?: string // tekst die bij de waarde gepubliceerd is: 'druk 1', 'tapez 2'
}
```

## Helpers {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // hetzelfde gerecht, via de kanton-id
getDivisions('enterprise-court-gent') // zijn acht afdelingen
getCourtsForCanton('gent-1') // zijn vredegerecht, en één gerecht van elk ander type
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], op REFNIS-code
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // de waarde van het eerste passende contact
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Hoe de data wordt gelezen {#how-the-data-is-read}

Het portaal heeft een pagina per gerecht en per afdeling, in de taal van het gerecht; tweetalige
gerechten in Brussel hebben een pagina in het Nederlands en een in het Frans, en de gerechten
in Eupen een in het Frans en een in het Duits. De parser:

1. leest het type en de plaats van het gerecht uit zijn naam
   (`Politierechtbank Limburg - afdeling Genk`), en het kanton van een vredegerecht uit zijn
   naam en nummer;
2. voegt de taalversies van één gerecht samen tot één record: namen, pagina's en openingsuren
   per taal; adres en contactgegevens uit de eerste taal (Nederlands in Brussel, Duits in
   Eupen), aangevuld met elke waarde die alleen op de andere pagina staat;
3. leest de contactblokken van de griffies, en bewaart elke waarde bij haar griffie;
4. zet de gepubliceerde openingsuren alleen om naar de `opening_hours`-syntaxis als elk woord
   begrepen is en elke taal hetzelfde zegt. Tekst met een opmerking of een tijdelijke regeling
   ("OPGELET: tot 31 december…") behoudt alleen de gepubliceerde tekst;
5. geeft elk gerecht de kantons die de wet het toewijst (`cantons`), uit een tabel van de
   bijlage bij het Gerechtelijk Wetboek in `scripts/parse/jurisdictions.ts`, en leidt daaruit
   zijn `arrondissement` af. De tabel en het portaal controleren elkaar: een gerecht op het
   portaal dat in de wettabel ontbreekt, of omgekeerd, stopt de build.

Hij weigert iets te schrijven als een pagina niet te plaatsen is (een onbekende soort gerecht,
een vredegerecht zonder kanton), een kanton geen gerecht heeft, of de wettabel en het portaal het
oneens zijn over welke gerechten bestaan. Wat hij niet kan lezen (een telefoonnummer zonder
zonenummer, een adres geschreven als een zin) wordt gerapporteerd bij de data-pull-request,
en uit de data weggelaten in plaats van geraden.

## Canonieke waarden {#canonical-values}

| Waarde         | Opgeslagen als                                   | Waarom                                                                                                                                                 |
| -------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Telefoonnummer | E.164: `+3253820701`                             | Eén vorm per nummer, van overal te bellen, `tel:`-links werken zoals ze zijn                                                                           |
| IBAN           | Elektronisch formaat: `BE73679200844560`         | De vorm die betaalsystemen aannemen; de checksum wordt gecontroleerd bij het lezen en in de tests                                                      |
| E-mail         | Kleine letters                                   | Vergelijkingen en ontdubbeling werken                                                                                                                  |
| Openingsuren   | `opening_hours`: `Mo-Fr 08:30-12:30,13:30-16:00` | De OpenStreetMap-standaard, met parsers in veel talen (bv. [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) en zonder eigen taal |
| Straat         | Zoals gepubliceerd                               | Nummers, bussen en verdiepingen worden op te veel manieren geschreven (`Canadaplein ZN`, `Rue de Bruxelles 2 - 3`) om ze zonder gissen te splitsen     |
