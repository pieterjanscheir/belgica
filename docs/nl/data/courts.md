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

| Veld               | Type                                  | Beschrijving                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`               | `CourtId`                             | Stabiele id: het `type`, dan de plaats in de taal van het gerecht: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. Zie [identifiers](/nl/guide/identifiers)                                                                                                                                                                                                                                |
| `validFrom`        | string?                               | Eerste dag waarop het record geldt, `YYYY-MM-DD`: de dag waarop het portaal het voor het eerst vermeldde. Geen: sinds het begin van de dekking                                                                                                                                                                                                                                                                                       |
| `validTo`          | string?                               | Laatste dag waarop het record geldt: de dag vóór de controle die het niet meer op het portaal vond. Geen: geldt nog steeds                                                                                                                                                                                                                                                                                                           |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                                                                                                                                                                                                                                |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | Het gerecht zelf, een van zijn afdelingen (afdeling, division, Abteilung), of een van de plaatsen waar een vredegerecht zetelt                                                                                                                                                                                                                                                                                                       |
| `court`            | `CourtId`?                            | Voor een afdeling of zetel: het gerecht waar ze toe behoort                                                                                                                                                                                                                                                                                                                                                                          |
| `name`             | `{ nl?, fr?, de? }`                   | De naam zoals het gerecht die publiceert, in elke taal waarin het een pagina heeft: `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                                                                                                     |
| `judicialArea`     | `JudicialAreaId`                      | Het rechtsgebied                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `arrondissement`   | `ArrondissementId`?                   | Het arrondissement, voor een gerecht of afdeling waarvan het gebied één arrondissement is of erbinnen ligt                                                                                                                                                                                                                                                                                                                           |
| `canton`           | `CantonId`?                           | Voor een vredegerecht: het kanton dat het bedient                                                                                                                                                                                                                                                                                                                                                                                    |
| `cantons`          | `CantonId[]`?                         | Voor elk ander gerecht: de kantons die het bestrijkt, zoals de bijlage bij het Gerechtelijk Wetboek (art. 3–5) en art. 114 van het Wetboek ze vastleggen. Voor een afdeling: de kantons die volledig in haar gebied liggen, zoals de koninklijke besluiten op grond van art. 186 van het Wetboek het vastleggen (zie [afdelingen](#divisions)); het gebied voor burgerlijke zaken waar het besluit voor strafzaken een ander bepaalt |
| `municipalities`   | `MunicipalityId[]`?                   | Voor een afdeling waarvan het gebied maar een deel van een kanton omvat: die gemeenten, op REFNIS-code                                                                                                                                                                                                                                                                                                                               |
| `criminalArea`     | `{ cantons?, municipalities? }`?      | Voor een afdeling waarvan het besluit voor strafzaken een ander gebied bepaalt dan voor burgerlijke zaken: haar gebied in strafzaken, te lezen zoals `cantons` en `municipalities`. Ontbreekt waar de afdeling één gebied heeft voor beide                                                                                                                                                                                           |
| `ecli`             | `string[]`?                           | De ECLI-codes van het gerecht, één per taal waarin het rechtspreekt; alleen codes die in gepubliceerde beslissingen voorkomen                                                                                                                                                                                                                                                                                                        |
| `address`          | `Address`?                            | Waar de griffie is, met de gemeente waartoe de postcode behoort (`municipality`, op REFNIS-code). Ontbreekt als het gerecht geen enkel adres publiceert (een gerecht waarvan elke afdeling haar eigen adres heeft)                                                                                                                                                                                                                   |
| `contacts`         | `Contact[]`                           | Telefoon, fax, e-mail en bankrekening, elk met de griffie waar het bij hoort (`label`) en de tekst die erbij gepubliceerd is (`note`)                                                                                                                                                                                                                                                                                                |
| `openingHours`     | string?                               | Openingsuren van de griffie in de OpenStreetMap-syntaxis [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours): `Mo-Fr 08:30-12:30,13:30-16:00`, alleen als de gepubliceerde tekst precies dat zegt                                                                                                                                                                                                               |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | De openingsuren zoals gepubliceerd, per taal                                                                                                                                                                                                                                                                                                                                                                                         |
| `website`          | `{ nl?, fr?, de? }`                   | De pagina van het gerecht op het portaal, per taal                                                                                                                                                                                                                                                                                                                                                                                   |
| `sources`          | `{ url, retrieved }[]`                | De pagina's waaruit het record is gelezen, en wanneer hun inhoud voor het eerst is gezien                                                                                                                                                                                                                                                                                                                                            |

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
    municipalities?: MunicipalityId[]
    criminalArea?: { cantons?: CantonId[]; municipalities?: MunicipalityId[] }
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

## Afdelingen {#divisions}

Een rechtbank van eerste aanleg, een ondernemingsrechtbank, een arbeidsrechtbank, een arbeidshof of
een politierechtbank kan in afdelingen (divisions) verdeeld zijn: waar je neerlegt, en waar de
zitting plaatsvindt. De afdeling van een ondernemingsrechtbank is ook de afdeling in de vermelding
van het rechtspersonenregister op bedrijfsdocumenten ("RPR Gent, afdeling Brugge"). Een koninklijk
besluit op grond van art. 186 van het Gerechtelijk Wetboek legt het gebied van elke afdeling vast:
het besluit van 14 maart 2014 of, voor veel gerechten sindsdien, het eigen zaakverdelingsreglement
van het gerecht. De hervorming van de kantons van 2017–2019 en de gemeentefusies van 2025 hebben
beide gewijzigd.

Elke afdeling heeft haar gebied in `cantons`: de kantons die er volledig in liggen. Waar een besluit
een kanton splitst, somt de afdeling in `municipalities` de gemeenten op die ze eruit krijgt. De
arbeidsrechtbank Henegouwen stuurt Pont-à-Celles (kanton Seneffe) naar Charleroi, en Erquelinnes en
Merbes-le-Château (kanton Chimay) naar Binche. De rechtbank van eerste aanleg Luik (sinds 2024) en
de politierechtbanken Limburg en Luik geven hun afdelingen lijsten van gemeenten in plaats van
kantons. Een gemeente behoort tot de afdeling die ze in `municipalities` noemt, of anders tot de
afdeling die haar kanton heeft. `findDivisionsWithJurisdiction` doet die opzoeking.

### Burgerlijke zaken en strafzaken {#civil-and-criminal-cases}

Een besluit kan één gebied voor burgerlijke zaken bepalen en een ander voor strafzaken. De
rechtbank van eerste aanleg en de politierechtbank Antwerpen doen dat, in hun besluiten van
16 december 2020: in burgerlijke zaken gaat het hele kanton Heist-op-den-Berg naar de afdeling
Mechelen, en in strafzaken (met de burgerlijke vorderingen die daarin behandeld worden) gaan zijn
gemeenten Hulshout en Herenthout naar Turnhout.

`cantons` en `municipalities` zijn dan het gebied in burgerlijke zaken, en de afdeling heeft haar
gebied in strafzaken in `criminalArea`, met dezelfde twee velden:

```ts
getCourt('police-court-antwerpen-turnhout').criminalArea
// { cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
//   municipalities: ['13012', '13016'] }   Herenthout en Hulshout
```

Alleen een afdeling waarvan de twee gebieden verschillen, heeft een `criminalArea`: vandaag vier,
Mechelen en Turnhout van beide gerechten. Voor elke andere afdeling geldt het ene gebied voor
beide. `findDivisionsWithJurisdiction` neemt de soort zaak aan als `matter`:

```ts
const ids = (matter) =>
    findDivisionsWithJurisdiction('13016', 'police-court', { matter }).map((d) => d.id)
ids('civil') // ['police-court-antwerpen-mechelen']
ids('criminal') // ['police-court-antwerpen-turnhout']
ids() // beide, de burgerlijke eerst: de soort zaak beslist
```

### Bronnen {#sources}

De gebieden zijn de geldende tekst, met de hand geconsolideerd uit de publicaties in het Belgisch
Staatsblad die elke afdeling in `sources` vermeldt: het besluit dat het gebied vastlegt en elk
later besluit dat het wijzigde. De gebieden van de politierechtbanken zijn gelezen uit de
geconsolideerde teksten van Justel. Een test controleert dat de afdelingen van een gerecht zijn
gebied precies één keer bestrijken, in burgerlijke zaken en in strafzaken.

Een besluit kan ook één soort zaak voor het hele gerecht naar één afdeling sturen: de collectieve
schuldenregelingen van de arbeidsrechtbank Henegouwen, of, bij de politierechtbank Luik, de
misdrijven die tot de bevoegdheid van de arbeidsgerechten behoren. Die regels zitten niet in de
data.

## Helpers {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // hetzelfde gerecht, via de kanton-id
getDivisions('enterprise-court-gent') // zijn acht afdelingen
getCourtsForCanton('gent-1') // zijn vredegerecht, en één gerecht van elk ander type
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], op REFNIS-code
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findDivisionsWithJurisdiction('44021', 'police-court') // [police-court-oost-vlaanderen-gent]
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
