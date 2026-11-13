<script setup>
import { data as stats } from '../.vitepress/stats.data'

const areas = {
    'justice-of-the-peace': 'A canton; Philippeville sits in two places',
    'police-court': 'An arrondissement (Brussels split by language, Halle, Vilvoorde)',
    'court-of-first-instance': 'An arrondissement (Brussels split by language)',
    'enterprise-court': 'An arrondissement, or the area of a court of appeal',
    'labour-court': 'An arrondissement, or the area of a court of appeal',
    'court-of-appeal': 'A judicial area',
    'labour-court-of-appeal': 'A judicial area',
    'court-of-assize': 'A province, or Brussels-Capital',
}
</script>

# Courts

File: `data/courts.json`. Every court of the judiciary that the courts' own portal,
[tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), lists: {{ stats.courts.total }}
records that apply today<span v-if="stats.courts.retired">, and {{ stats.courts.retired }} retired
versions the portal no longer lists</span>. The numbers on this page are computed from the data when
the site is built.

<table>
<thead><tr><th>Kind</th><th style="text-align:right">Courts</th><th style="text-align:right">Divisions or seats</th><th>Area</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ t.label }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

Not on the portal, so not here yet: the Court of Cassation, the Constitutional Court and the
Council of State, and the disciplinary courts.

## Why it's useful

- **Addressing documents.** Writs of summons, petitions and conclusions name the court as it
  names itself; letters and filings go to the registry (griffie, greffe) at its address.
- **Contacting the right registry.** Larger courts have a registry per matter (civil,
  criminal, family, the register of legal entities…), each with its own phone number, e-mail
  and sometimes bank account. The data keeps them apart, labelled as the court labels them.
- **Paying fees.** Registries that publish a bank account for court fees and deposits have it
  in the data, checksum verified.
- **Building forms.** Court pickers need a complete list with stable ids, linked to cantons,
  arrondissements and judicial areas, and to the court a division belongs to.
- **Linking to case law.** `ecli` gives the code the court's decisions carry in their
  European Case Law Identifier (`ECLI:BE:HBGNT:…`).

## Source and updates

|              |                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source       | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), the portal of the College of Courts and Tribunals; the courts' areas from the annex to the Judicial Code, art. 3–5 |
| Built by     | `scripts/parse` from snapshots of every court's page and contact page                                                                                                                |
| Changes when | A court moves, changes its contacts or hours, or the portal adds or renames a court                                                                                                  |
| Covers       | 1 January 2025 onwards: lookups for an earlier day throw a `RangeError` ([time](/guide/concepts#time))                                                                               |
| Checked      | Twice a week, by the [sources workflow](/guide/data-quality#how-the-data-is-built); changes arrive as a pull request                                                                 |
| Licence      | CC BY 4.0                                                                                                                                                                            |

Every record lists the pages it was read from and the day each page's content was first seen
(`sources`). Contact details change more often than anything else in this package: when it
matters, check the court's page (`website`).

<CourtList />

## Fields

| Field              | Type                                  | Description                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | Stable id: the `type`, then the place in the court's own language: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. See [identifiers](/guide/identifiers)                                                                                                                                                    |
| `validFrom`        | string?                               | First day the record applies, `YYYY-MM-DD`: the day the portal first listed it. None: since the coverage starts                                                                                                                                                                                                                                       |
| `validTo`          | string?                               | Last day the record applies: the day before the check that found it gone from the portal. None: still applies                                                                                                                                                                                                                                         |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                                                                                                                                                 |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | The court itself, one of its divisions (afdeling, division, Abteilung), or one of the places a justice of the peace sits                                                                                                                                                                                                                              |
| `court`            | `CourtId`?                            | For a division or seat: the court it belongs to                                                                                                                                                                                                                                                                                                       |
| `name`             | `{ nl?, fr?, de? }`                   | The name as the court publishes it, in each language it has a page in: `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                                   |
| `label`            | `{ nl, fr, de }`?                     | For a justice of the peace (not its seats): a display label built from its canton, `Vredegerecht 1e kanton Gent`, as `formatCourtName(court, locale, { style: 'canton' })` gives it. Generated, not the official name                                                                                                                                 |
| `judicialArea`     | `JudicialAreaId`                      | The judicial area                                                                                                                                                                                                                                                                                                                                     |
| `arrondissement`   | `ArrondissementId`?                   | The arrondissement, for a court or division whose area is one arrondissement or lies within one                                                                                                                                                                                                                                                       |
| `canton`           | `CantonId`?                           | For a justice of the peace: the canton it serves                                                                                                                                                                                                                                                                                                      |
| `cantons`          | `CantonId[]`?                         | For every other court: the cantons it covers, as the annex to the Judicial Code (art. 3–5) and art. 114 of the Code set them. For a division of a court of first instance, enterprise or labour court or labour court of appeal: the cantons wholly in its area, as the royal decrees under art. 186 of the Code set it (see [divisions](#divisions)) |
| `municipalities`   | `MunicipalityId[]`?                   | For a division whose area takes only part of a canton: those municipalities, by REFNIS code                                                                                                                                                                                                                                                           |
| `ecli`             | `string[]`?                           | The court's ECLI codes, one per language it judges in; only codes seen in published decisions                                                                                                                                                                                                                                                         |
| `address`          | `Address`?                            | Where the registry is, with the municipality its postal code belongs to (`municipality`, by REFNIS code). Missing when the court publishes no single address (a court whose divisions each have their own)                                                                                                                                            |
| `contacts`         | `Contact[]`                           | Phone, fax, e-mail and bank account, each with the registry it belongs to (`label`) and the text published with it (`note`)                                                                                                                                                                                                                           |
| `openingHours`     | string?                               | Registry hours in OpenStreetMap [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours) syntax: `Mo-Fr 08:30-12:30,13:30-16:00`, only when the published text says exactly that                                                                                                                                                      |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | The opening hours as published, per language                                                                                                                                                                                                                                                                                                          |
| `website`          | `{ nl?, fr?, de? }`                   | The court's page on the portal, per language                                                                                                                                                                                                                                                                                                          |
| `sources`          | `{ url, retrieved }[]`                | The pages the record was read from, and when their content was first seen                                                                                                                                                                                                                                                                             |

::: tip New court types
`type` may gain values (the Court of Cassation, for one). If you `switch` on it, keep a
`default` branch so a new type doesn't break your code.
:::

## Shape

```ts
interface Court {
    id: CourtId
    validFrom?: string
    validTo?: string
    type: CourtType
    kind: 'court' | 'division' | 'seat'
    court?: CourtId
    name: Partial<Translated>
    label?: Translated
    judicialArea: JudicialAreaId
    arrondissement?: ArrondissementId
    canton?: CantonId
    cantons?: CantonId[]
    municipalities?: MunicipalityId[]
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
    street: string // as published, with number, box or floor: 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // through the postal code; see the postal codes page
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // canonical: E.164, lowercase e-mail, electronic IBAN
    label?: string // the registry or service: 'Burgerlijke griffie', 'Greffe pénal'
    note?: string // text published with the value: 'druk 1', 'tapez 2'
}
```

## Locations

File: `data/court-locations.json`, entry point `belgica/court-locations`. A point on the map
for each justice of the peace, from the National Geographic Institute's peace court layer in
the [file the canton boundaries come from](/data/canton-boundaries#source-and-updates).

```ts
import { getCourtLocation } from 'belgica/court-locations'

getCourtLocation('justice-of-the-peace-aalst-1')?.geometry
// { type: 'Point', coordinates: [4.0409722, 50.941518] }: longitude, latitude (WGS 84)
```

| Field                  | Type                   | Description                                                                        |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `id`, `court`          | `CourtId`              | The court, or seat of one, the point is the location of                            |
| `validFrom`, `validTo` | string?                | The days the record applies. See [time](/api#time)                                 |
| `ngiId`                | string                 | The NGI's identifier of the point (its `tgid`), a GUID                             |
| `address`              | string                 | The address the NGI gives with the point, as published: `Place de la Résistance 3` |
| `geometry`             | `Point`                | GeoJSON, WGS 84, longitude first, rounded to 7 decimals                            |
| `sources`              | `{ url, retrieved }[]` | The NGI file the record was read from                                              |

::: warning Not every justice of the peace has one
The NGI moves a point when it hears of a move, and doesn't always: in its July 2026 file,
about one point in seven still sits at a building the court has left. A point is only kept
when the NGI's address has the house number of the court's address on the portal (comparing
numbers, not streets, keeps the Brussels courts whose address the NGI gives in French and the
portal in Dutch). The others are left out, and listed by the build. So
`getCourtLocation` returns `undefined` for those courts, and for every other kind of court,
which the NGI has no layer for.
:::

## Divisions

A court of first instance, an enterprise court, a labour court or a labour court of appeal can
be split into divisions (afdelingen, divisions): where you file, and where the hearing is. An
enterprise court's division is also the one in the register of legal entities mention on
company documents ("RPR Gent, afdeling Brugge"). A royal decree under art. 186 of the Judicial
Code sets each division's area: the decree of 14 March 2014 or, for many courts since, the
court's own case-allocation decree (zaakverdelingsreglement). The canton reforms of 2017–2019
and the municipal mergers of 2025 changed both.

Each division has its area in `cantons`: the cantons wholly in it. Where a decree splits a
canton, the division lists the municipalities it takes from it in `municipalities`. The labour
court of Hainaut sends Pont-à-Celles (canton Seneffe) to Charleroi, and Erquelinnes and
Merbes-le-Château (canton Chimay) to Binche. Since 2024 the court of first instance of Liège
gives its divisions lists of municipalities rather than cantons. A municipality belongs to the
division that names it in `municipalities`, or else to the one that has its canton.
`findDivisionsWithJurisdiction` does that lookup.

The areas are the text in force, consolidated by hand from the publications in the Belgian
Official Journal that each division cites in `sources`: the decree that sets the area and every
later one that changed it. A test checks that a court's divisions cover its area once.

- The police courts' divisions have no area yet. Their decrees list municipalities, and the
  police court of Antwerp has one area for civil and one for criminal cases
  ([#58](https://github.com/pieterjanscheir/belgica/issues/58)).
- `cantons` is the area in civil cases. In criminal cases the court of first instance of Antwerp
  sends Hulshout and Herenthout (canton Heist-op-den-Berg) to Turnhout instead of Mechelen.
- A decree can also send one kind of case to one division for the whole court, such as the
  collective debt settlements of the labour court of Hainaut. Those rules aren't in the data.

## Helpers

Each is described, with its results and errors, in the [API reference](/api#courts).

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // the same court, by canton id
getDivisions('enterprise-court-gent') // its eight divisions
getCourtsForCanton('gent-1') // its justice of the peace, and one court of each other type
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], by REFNIS code
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // the first matching contact's value
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Only the courts you need

`data/courts.json` is the complete file, about 580 KB. An app that needs some courts, in a
browser above all, can load smaller files generated from it. Every path below is public API, like
the ids.

| File                                           | Contents                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `data/courts/<type>.json`                      | Every court, division and seat of a type, in all of Belgium                                                        |
| `data/courts/<type>/<arrondissement>.json`     | Those of one type in one arrondissement                                                                            |
| `data/courts/<type>/judicial-area/<area>.json` | Those of one type without an arrondissement, by judicial area                                                      |
| `data/courts/details/<id>.json`                | One court's `contacts`, `openingHours`, `openingHoursText`, `website`, `sources` and `ecli`, one entry per version |
| `data/courts/index.json`                       | Each court id → its file under `data/courts/`, without `.json`                                                     |

The list files hold summaries (`CourtSummary`): `id`, `validFrom`, `validTo`, `type`, `kind`,
`court`, `name`, `label`, `canton`, `cantons`, `municipalities`, `arrondissement`, `judicialArea` and `address`.
A summary and its details together are the full record. Every court is in exactly one
`<type>/…` file; a court whose area covers several arrondissements (a court of appeal, the
labour courts of Antwerpen and Liège, …) has no `arrondissement` and is in the file of its
judicial area. Like `data/courts.json`, the files hold every version of a record.

Import a file statically when you know which one you need. The 38 justices of the peace of East
and West Flanders are 15 KB minified (2 KB gzip), against 410 KB for `belgica/courts`:

```ts
import east from 'belgica/data/courts/justice-of-the-peace/oost-vlaanderen.json' with { type: 'json' }
import west from 'belgica/data/courts/justice-of-the-peace/west-vlaanderen.json' with { type: 'json' }
import { formatCourtName, type CourtSummary } from 'belgica/courts/format'

// A JSON import types `type` and `kind` as string: cast to the summary type
const courts = [...east, ...west] as CourtSummary[]
courts.map((court) => formatCourtName(court, 'nl', { style: 'canton' }))
```

Or load them when they're needed, with `belgica/courts/load`. Each file is its own `import()`,
so a bundler makes a chunk of it and a browser downloads only what you ask for:

```ts
import { loadCourts, loadCourt, loadCourtDetails } from 'belgica/courts/load'

await loadCourts({ type: 'justice-of-the-peace', arrondissement: 'oost-vlaanderen' })
await loadCourt('justice-of-the-peace-gent-1') // an id from a saved file: index.json, then its file
await loadCourtDetails('justice-of-the-peace-gent-1') // its contacts, for the one court you show
```

The loader is 8 KB minified (2 KB gzip). Every file needs an entry in it, so the map of the 347
details files is a chunk of its own, 31 KB (5 KB gzip), that the first `loadCourtDetails` loads.

`belgica/courts/format` has `formatCourtName`, `getContact`, `formatPhoneNumber` and
`formatIban`, and loads no data: they work on a court you already hold.

## How the data is read

The portal has a page per court and per division, in the court's language; bilingual courts
in Brussels have a page in Dutch and one in French, and the courts in Eupen one in French and
one in German. The parser:

1. reads the court's type and place from its name (`Politierechtbank Limburg - afdeling Genk`),
   and the canton of a justice of the peace from its name and number;
2. merges the language versions of one court into one record: names, pages and opening hours
   per language; address and contacts from the first language (Dutch in Brussels, German in
   Eupen), with any value only the other page has;
3. reads the registries' contact blocks, keeping each value with its registry;
4. turns the published opening hours into `opening_hours` syntax only when every word is
   understood and every language says the same. Text with a note or a temporary arrangement
   ("OPGELET: tot 31 december…") keeps only the published text;
5. gives each court the cantons the law assigns it (`cantons`), from a table of the annex to
   the Judicial Code in `scripts/parse/jurisdictions.ts`, and derives its `arrondissement` from
   them. The table and the portal check each other: a court on the portal that the law table
   lacks, or the reverse, stops the build.

It refuses to write anything when a page can't be placed (an unknown kind of court, a justice
of the peace without a canton), a canton has no court, or the law table and the portal
disagree on which courts exist. What it can't read (a phone number
without an area code, an address written as a sentence) is reported with the data pull
request, and left out of the data rather than guessed.

## Canonical values

| Value         | Stored as                                        | Why                                                                                                                                                                |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phone number  | E.164: `+3253820701`                             | One form per number, dialable from anywhere, `tel:` links work as is                                                                                               |
| IBAN          | Electronic format: `BE73679200844560`            | The form payment systems take; the checksum is verified when read and in the tests                                                                                 |
| E-mail        | Lowercase                                        | Comparisons and deduplication work                                                                                                                                 |
| Opening hours | `opening_hours`: `Mo-Fr 08:30-12:30,13:30-16:00` | The OpenStreetMap standard, with parsers in many languages (e.g. [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) and no language of its own |
| Street        | As published                                     | Numbers, boxes and floors are written too many ways (`Canadaplein ZN`, `Rue de Bruxelles 2 - 3`) to split them without guessing                                    |
