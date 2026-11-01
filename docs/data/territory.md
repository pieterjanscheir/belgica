<script setup>
import { judicialAreas, arrondissements, getJudicialArea, regions, provinces, getRegion } from '../../src'
</script>

# Territory and cantons

Belgium's judicial map has three levels: **judicial areas** (one per court of appeal) contain
**arrondissements**, which contain **cantons** (one justice of the peace each). Cantons are
defined in terms of **municipalities**. Next to the judicial map, the administrative one:
every municipality lies in a **region** and, outside Brussels, in a **province**.

## Why it's useful

- **Which justice of the peace?** Rent disputes, small claims, guardianship and neighbour
  disputes go to a justice of the peace, usually the one of the canton where the defendant
  lives or the property lies. Getting the canton wrong means a claim filed at the wrong court.
- **Which arrondissement?** Courts of first instance, enterprise and labour courts, the
  prosecutor's office, and the territory where a bailiff may act are all organised per
  arrondissement.
- **Which court of appeal?** Appeals go to the court of appeal of the judicial area.
- **Joining data.** Anything with a REFNIS code (Statbel statistics, regional open data,
  address registers) can be put on the judicial map.

The law describes cantons in prose ("the part of the territory of the city of Antwerpen bounded
by the centre lines of the Brouwersvliet…"). These files turn it into data while keeping the
legal text for the cases where only the text can decide.

## Source and updates

|              |                                                                                                                                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | Annex to the Judicial Code, "Gebiedsomschrijving en zetel van hoven en rechtbanken" ([ELI, numac 1967101058](https://www.ejustice.just.fgov.be/eli/wet/1967/10/10/1967101058/justel)), Dutch and French; Statbel open data for municipalities, provinces and regions |
| Built by     | `pnpm build:cantons` (cantons, municipalities); snapshots + `pnpm build:data` (regions, provinces); by hand (areas, arrondissements)                                                                                                                                 |
| Changes when | A law amends the annex; municipalities merge (2019, 2025)                                                                                                                                                                                                            |
| Covers       | 1 January 2025 onwards: lookups for an earlier day throw a `RangeError` ([time](/api#time))                                                                                                                                                                          |
| Checked      | Rebuilt by hand with `pnpm build:cantons`: ejustice refuses GitHub's servers ([data quality](/guide/data-quality))                                                                                                                                                   |
| Licence      | CC BY 4.0; municipality data © Statbel, CC BY 4.0                                                                                                                                                                                                                    |

## Find the canton for a municipality

<CantonLookup />

## Judicial areas

The 5 areas of the courts of appeal (rechtsgebieden). File: `data/judicial-areas.json`.
Source: annex to the Judicial Code (Ger.W. bijvoegsel), art. 5.

<table>
<thead><tr><th>Id</th><th>nl</th><th>fr</th><th>de</th></tr></thead>
<tbody>
<tr v-for="a in judicialAreas" :key="a.id">
<td><code>{{ a.id }}</code></td><td>{{ a.name.nl }}</td><td>{{ a.name.fr }}</td><td>{{ a.name.de }}</td>
</tr>
</tbody>
</table>

```ts
interface JudicialArea {
    id: JudicialAreaId // 'gent'
    name: Translated // { nl, fr, de }
}
```

## Arrondissements

The 12 judicial arrondissements. File: `data/arrondissements.json`. Source: Ger.W. bijvoegsel
art. 4.

<table>
<thead><tr><th>Id</th><th>nl</th><th>fr</th><th>de</th><th>Judicial area</th></tr></thead>
<tbody>
<tr v-for="a in arrondissements" :key="a.id">
<td><code>{{ a.id }}</code></td><td>{{ a.name.nl }}</td><td>{{ a.name.fr }}</td><td>{{ a.name.de }}</td>
<td>{{ getJudicialArea(a.judicialArea)?.name.nl }}</td>
</tr>
</tbody>
</table>

```ts
interface Arrondissement {
    id: ArrondissementId // 'oost-vlaanderen'
    name: Translated
    judicialArea: JudicialAreaId
}
```

## Cantons

All 162 judicial cantons: the area of one justice of the peace each. File: `data/cantons.json`
(generated from the annex to the Judicial Code, art. 1).

The `territory` texts are most of that file. `data/cantons/summaries.json` has the cantons
without them and `data/cantons/territory.json` the texts alone, both generated from
`data/cantons.json`. In code, `belgica/cantons` looks up a canton's name, number, seat,
arrondissement and municipalities without loading the texts, and `belgica/cantons/territory`
has `getCantonTerritory(id)`; `belgica/territory` keeps the full records.

### Fields

| Field            | Type                           | Description                                                                                                    |
| ---------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `id`             | `CantonId`                     | Stable id in the local language, with a number for multi-canton places: `gent-1`, `merelbeke-melle`, `wavre-1` |
| `arrondissement` | string                         | Arrondissement id                                                                                              |
| `name`           | `{ nl, fr, de? }`              | Name of the canton as the annex gives it; `de` only where an official German text names it                     |
| `number`         | number?                        | Canton number in places with several (Gent 1–5)                                                                |
| `seat`           | `{ nl, fr }`                   | Where the justice of the peace sits; can differ from the name                                                  |
| `municipalities` | `{ municipality, partial? }[]` | Municipalities covered, by REFNIS code; `partial: true` when only part is                                      |
| `territory`      | `{ nl, fr }`                   | The canton's area, verbatim from the annex                                                                     |
| `legalBasis`     | `{ url, provision }`           | Where the law defines it: the annex's ELI and the section, e.g. `Bijvoegsel art. 1, afdeling 6.15` (Gent 4)    |
| `sources`        | `{ url, retrieved }[]`?        | The official German text the German name is taken from                                                         |

```ts
interface Canton {
    id: CantonId // 'gent-1', 'merelbeke-melle'
    arrondissement: ArrondissementId
    name: Bilingual & { de?: string } // usually the seat, but not always
    number?: number // for places with several cantons (Gent 1–5, …)
    seat: Bilingual // where the justice of the peace sits
    municipalities: { municipality: MunicipalityId; partial?: boolean }[]
    territory: Bilingual // the canton's area, verbatim from the annex
    legalBasis: { url: string; provision: string } // the annex's ELI, and the section
    sources?: SourceRef[] // the official German text, for a canton with a German name
}
```

- **Ids** follow the local language: Dutch in Flanders and Brussels, French in Wallonia, German
  around Eupen; Brussels, which is bilingual, takes the Dutch name. See [identifiers](/guide/identifiers).
  The justice of the peace links to its canton through its `canton` field.
- **Name and seat can differ**: canton `oudergem` sits in Etterbeek.
- **`partial: true`** marks a municipality that is split over several cantons. The `territory`
  text then says which part (streets, numbers, waterways) belongs to this canton.
- **German names** only where an official German text names the canton: the annex has no German
  translation. Today that's the two cantons of Eupen-Sankt Vith, from the German translation of the
  ministerial decree of 31 October 2023 (Belgisches Staatsblatt of 18 July 2024), which names the
  second; the first is also named on its court's German page on the courts' portal. Both are listed
  in `sources`. No name is translated by hand.

### Split municipalities

55 cantons cover only part of a municipality. For these, the canton can't be determined from the
municipality alone: it depends on the street (and sometimes the house number). The `territory`
text names the boundaries. With the address's coordinates, `findCantonsAt(lon, lat)` from
`belgica/canton-boundaries` finds the canton in the NGI's
[canton boundaries](./canton-boundaries); without them, show the candidate cantons and their
text, and let a person decide. Where the geometry and the text disagree, the text is the law.

## Municipalities

The 565 municipalities with their Statbel REFNIS (NIS) code. File: `data/municipalities.json`
(generated from Statbel). © Statbel, CC BY 4.0.

```ts
interface Municipality {
    id: MunicipalityId // the REFNIS code: '44021' for Gent
    name: Bilingual
    province: ProvinceId | '04000' // REFNIS code of the province; '04000' in Brussels
    region: RegionId // REFNIS code of the region
}
```

The 19 municipalities of the Brussels-Capital Region have no province. Their `province` is
`04000`, the region's code, which is what Statbel puts in the province column of its own files,
and `getProvinceForMunicipality` returns `undefined` for them; `getRegionForMunicipality` gives
the region. The codes are listed below, from the data.

## Regions

The 3 regions (gewesten, régions). File: `data/regions.json` (generated from Statbel's REFNIS
code list; names as Statbel publishes them). © Statbel, CC BY 4.0.

<table>
<thead><tr><th>Id (REFNIS)</th><th>nl</th><th>fr</th><th>de</th></tr></thead>
<tbody>
<tr v-for="r in regions" :key="r.id">
<td><code>{{ r.id }}</code></td><td>{{ r.name.nl }}</td><td>{{ r.name.fr }}</td><td>{{ r.name.de }}</td>
</tr>
</tbody>
</table>

```ts
interface Region {
    id: RegionId // the REFNIS code: '02000', '03000', '04000'
    name: Translated // { nl, fr, de }, as Statbel publishes them
    sources: SourceRef[] // Statbel's REFNIS code list
}
```

## Provinces

The 10 provinces, with their region. File: `data/provinces.json` (generated from Statbel's
REFNIS code list). © Statbel, CC BY 4.0. The Brussels-Capital Region has no province; the
province of Brabant, which ended on 31 December 1994, is before the data's coverage.

<table>
<thead><tr><th>Id (REFNIS)</th><th>nl</th><th>fr</th><th>de</th><th>Region</th></tr></thead>
<tbody>
<tr v-for="p in provinces" :key="p.id">
<td><code>{{ p.id }}</code></td><td>{{ p.name.nl }}</td><td>{{ p.name.fr }}</td><td>{{ p.name.de }}</td>
<td>{{ getRegion(p.region).name.nl }}</td>
</tr>
</tbody>
</table>

```ts
interface Province {
    id: ProvinceId // the REFNIS code: '40000' for Oost-Vlaanderen
    name: Translated // { nl, fr, de }, as Statbel publishes them
    region: RegionId
    sources: SourceRef[] // Statbel's REFNIS code list
}
```

Names are Statbel's, including the word for the kind of unit (`Provincie Oost-Vlaanderen`,
`Province de Flandre orientale`, `Provinz Ostflandern`): the package stores values as the source
publishes them, and doesn't shorten them.
