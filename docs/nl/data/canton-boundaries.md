# Kantongrenzen {#canton-boundaries}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
</script>

Bestand: `data/canton-boundaries.json`. De grens van elk van de {{ stats.cantons }} gerechtelijke
kantons als GeoJSON-geometrie, zoals het Nationaal Geografisch Instituut (NGI) ze digitaliseerde
uit de bijlage bij het Gerechtelijk Wetboek.

## Waarvoor het dient {#why-it-s-useful}

- **Het kanton van een adres in een gesplitste stad.** {{ stats.splitCantons }} kantons dekken
  maar een deel van een gemeente (Antwerpen, Gent, Brussel, Luik, Charleroi, …), en
  `getCantonsForMunicipality` kan alleen de kandidaten opsommen. Met het adres gegeocodeerd geeft
  `findCantonsAt(lon, lat)` het ene kanton, en dus het vredegerecht.
- **Kaarten.** De geometrie is standaard GeoJSON in WGS 84: teken de kantons op een kaart,
  koppel ze aan andere geodata, of laad ze in PostGIS, QGIS of een rekenblad met een kaart.
- **De wettekst controleren.** De polygonen van het NGI zijn een tweede lezing van dezelfde
  bijlage, naast de `territory`-tekst van elk kanton.

::: warning De wettekst wint
De grens is de interpretatie van het NGI van de bijlage bij het Gerechtelijk Wetboek,
gedigitaliseerd op kadastrale gemeentegrenzen, waterlopen en wegen. De bijlage zelf, letterlijk
geciteerd in de `territory` van elk kanton, is de wet. Lees voor een punt dicht bij een
grenslijn de tekst; die noemt de straten en de huisnummers.
:::

## Bron en updates {#source-and-updates}

|               |                                                                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bron          | NGI, [Gerechtelijke kantons en arrondissementen](https://www.geo.be/catalog/details/e1f61c40-623a-11eb-9e7c-186571a04de3) (Territoriale indelingen) op geo.be: de GeoPackage in WGS 84 (EPSG:4326), feature type `judicialcanton`, herzien op 16 juli 2026 |
| Licentie      | © NGI, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)                                                                                                                                                                                           |
| Gebouwd door  | `scripts/parse/boundaries.ts`, uit de snapshot van de GeoPackage                                                                                                                                                                                           |
| Verandert bij | Het NGI publiceert een nieuwe versie: elk jaar, wanneer de gemeentegrenzen van de FOD Financiën worden bijgewerkt, of wanneer een wet de bijlage wijzigt                                                                                                   |
| Dekking       | Vanaf 21 oktober 2026, de dag waarop het bestand voor het eerst werd gelezen: opzoekingen voor een vroegere dag gooien een `RangeError` ([tijd](/nl/api#time))                                                                                             |
| Gecontroleerd | Twee keer per week, door de [sources-workflow](/nl/guide/data-quality#how-the-data-is-built): de build faalt wanneer een kanton geen grens heeft of een grens bij geen enkel kanton past                                                                   |

Hoe het NGI de grenzen tekende, in zijn eigen woorden: waar de bijlage naar gemeentegrenzen
verwijst, gebruikte het de kadastrale grenzen van de FOD Financiën; waar ze naar waterlopen of
wegen verwijst, de eigen topografische data van het NGI; waar ze naar voormalige gemeenten
verwijst, de grenzen van die gemeenten bij het NGI. De schaal is 1:10 000.

## Velden {#fields}

| Veld                   | Type                   | Beschrijving                                                                                                                                                                |
| ---------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `CantonId`             | Het id van het kanton: een kanton heeft één grens, die zijn sleutel overneemt                                                                                               |
| `validFrom`, `validTo` | string?                | De dagen waarop het record geldt; geen: sinds het begin van de dekking, of geldt nog. Zie [tijd](/nl/api#time)                                                              |
| `canton`               | `CantonId`             | Het kanton waartoe de grens behoort                                                                                                                                         |
| `ngiId`                | string                 | De identificator van het object bij het NGI (zijn `tgid`), een GUID                                                                                                         |
| `cantonCode`           | `{ nl, fr }`           | De kantoncode in de data van het NGI: zes cijfers (`248112` voor Gent 1), met een voorvoegsel `N` of `F` per taal in Brussel-Hoofdstad en in Sint-Genesius-Rode (`N238104`) |
| `geometry`             | `MultiPolygon`         | GeoJSON ([RFC 7946](https://www.rfc-editor.org/rfc/rfc7946)): WGS 84, lengtegraad eerst, buitenringen tegen de klok in, gaten met de klok mee                               |
| `sources`              | `{ url, retrieved }[]` | Het NGI-bestand waaruit het record is gelezen                                                                                                                               |

```ts
interface CantonBoundary {
    id: CantonId // 'gent-1'
    canton: CantonId // 'gent-1'
    ngiId: string // '{3905ED53-F233-4C4E-8225-4E43FEC7C541}'
    cantonCode: Bilingual // { nl: '248114', fr: '248114' }
    geometry: MultiPolygon // { type: 'MultiPolygon', coordinates: [[[[lon, lat], …]]] }
    sources: SourceRef[]
}
```

De geometrie is die van het NGI, punt voor punt: er wordt niets vereenvoudigd. Coördinaten zijn
afgerond op 7 decimalen, ongeveer een centimeter, onder de eigen precisie van de bron. Elke
grens is één `MultiPolygon`, ook als ze één polygoon heeft, zodat elk record dezelfde vorm heeft.

### Hoe kantons aan de features van het NGI worden gekoppeld {#how-cantons-are-matched-to-the-ngi-s-features}

Het NGI noemt elke feature in het Nederlands en in het Frans (`Eerste gerechtelijk kanton Gent`,
`Premier canton judiciaire de Gand`). Een feature is de grens van een kanton wanneer beide
namen, omgezet naar een id op de [gebruikelijke manier](/nl/guide/identifiers), dat kanton
geven en over zijn nummer overeenstemmen. Zeven features dragen in beide talen hun plaatselijke
naam waar de bijlage een exoniem gebruikt (`Canton judiciaire de Halle`, waar de bijlage `Hal`
zegt; `Gerechtelijk kanton Huy`, waar ze `Hoei` zegt); die worden gekoppeld via hun kantoncode in
`CANTON_ALIASES` in de parser. Al het andere stopt de build.

## Omvang {#size}

De grenzen zijn veruit de grootste dataset: ongeveer een miljoen posities. Ze hebben een eigen
entry point, `belgica/canton-boundaries`, en de root van het package exporteert ze niet
opnieuw, dus niets laadt ze tenzij erom wordt gevraagd:

<table v-if="stats.sizes">
<thead><tr><th>Entry point</th><th style="text-align:right">JavaScript geladen</th><th style="text-align:right">gzip</th></tr></thead>
<tbody>
<tr v-for="s in stats.sizes.filter((s) => s.entry === 'belgica' || s.entry.endsWith('canton-boundaries'))" :key="s.entry">
<td><code>{{ s.entry }}</code></td><td style="text-align:right">{{ mb(s.raw) }}</td><td style="text-align:right">{{ mb(s.gzip) }}</td>
</tr>
</tbody>
</table>
<p v-else class="bld-muted">De groottes worden gemeten uit de build wanneer de site wordt gebouwd (eerst <code>pnpm build</code>).</p>

Het ruwe bestand, `data/canton-boundaries.json`, zit in het npm-package en in elke release, zodat
Python, PostGIS en GIS-tools het kunnen lezen zonder de JavaScript.

## Het kanton van een punt vinden {#finding-the-canton-of-a-point}

```ts
import { findCantonsAt, getCantonBoundary } from 'belgica/canton-boundaries'
import { getJusticeOfThePeace } from 'belgica/courts'

// Eerst de lengtegraad, dan de breedtegraad, zoals GeoJSON ze ordent
const [canton] = findCantonsAt(3.7268, 51.053) // Sint-Baafskathedraal, Gent → gent-1
getJusticeOfThePeace(canton.id).address // waar je neerlegt

findCantonsAt(2.3522, 48.8566) // [] : Parijs, buiten België
getCantonBoundary('gent-1').geometry // de MultiPolygon
```

`findCantonsAt` geeft één kanton terug voor een punt in België, geen buiten België, en beide
kantons voor een punt precies op de lijn tussen twee. Het heeft geen dependency nodig: een
gewone point-in-polygon-test over de grenzen, ongeveer een milliseconde per opzoeking. Het adres
geocoderen (straat en nummer naar coördinaten) is aan jou: de adresregisters van de gewesten
(het Adressenregister van Vlaanderen, UrbIS van Brussel, ICAR van Wallonië) en de federale
adresdata BeSt op geo.be doen dat.

## Van een adres naar de rechtbank {#from-an-address-to-the-court}

Typ een adres, of klik op de kaart: het adresregister van het gewest geocodeert het (het
Adressenregister in Vlaanderen, UrbIS in Brussel, ICAR in Wallonië), het punt gaat naar de
grenzen, en het kanton naar `getCourtsForCanton`. De kaart tekent elk kanton, en vanaf zoom 11,5
de grenzen op volle precisie over de gebouwen en huisnummers. Binnen 25 m van een ander kanton
waarschuwt de zoeker en toont hij de wettekst van beide. Hoe het stap voor stap gebouwd is, staat
op de pagina [rechtbankzoeker](/nl/guide/court-finder).

<CourtFinder />

## In andere talen {#in-other-languages}

Het bestand is gewone GeoJSON-geometrie per record, dus elk GIS leest het. In Python met Shapely:

```python
import json
from shapely.geometry import Point, shape

boundaries = json.load(open("data/canton-boundaries.json"))
polygons = {b["canton"]: shape(b["geometry"]) for b in boundaries}

def cantons_at(lon: float, lat: float) -> list[str]:
    point = Point(lon, lat)
    return [canton for canton, polygon in polygons.items() if polygon.covers(point)]

cantons_at(3.7268, 51.053)  # ['gent-1']
```
