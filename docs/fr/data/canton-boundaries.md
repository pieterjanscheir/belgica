# Limites des cantons {#canton-boundaries}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const kb = (bytes) => `${Math.round(bytes / 1024)} Ko`
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} Mo`
</script>

Fichier : `data/canton-boundaries.json`. La limite de chacun des {{ stats.cantons }} cantons
judiciaires en géométrie GeoJSON, telle que l'Institut géographique national (IGN) l'a numérisée à
partir de l'annexe au Code judiciaire.

## À quoi ça sert {#why-it-s-useful}

- **Le canton d'une adresse dans une ville scindée.** {{ stats.splitCantons }} cantons ne couvrent
  qu'une partie d'une commune (Anvers, Gand, Bruxelles, Liège, Charleroi, …), et
  `getCantonsForMunicipality` ne peut qu'énumérer les candidats. Une fois l'adresse géocodée,
  `findCantonsAt(lon, lat)` donne le canton, et donc la justice de paix.
- **Cartes.** La géométrie est du GeoJSON standard en WGS 84 : dessinez les cantons sur une carte,
  joignez-les à d'autres géodonnées, ou chargez-les dans PostGIS, QGIS ou un tableur avec carte.
- **Vérifier le texte légal.** Les polygones de l'IGN sont une seconde lecture de la même annexe,
  à côté du texte `territory` de chaque canton.

::: warning Le texte légal l'emporte
La limite est l'interprétation par l'IGN de l'annexe au Code judiciaire, numérisée sur les limites
des communes cadastrales, les cours d'eau et les routes. L'annexe elle-même, citée mot pour mot
dans le `territory` de chaque canton, est la loi. Pour un point proche d'une ligne de limite, lisez
le texte ; il nomme les rues et les numéros de maison.
:::

## Source et mises à jour {#source-and-updates}

|               |                                                                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source        | IGN, [Cantons et arrondissements judiciaires](https://www.geo.be/catalog/details/e1f61c40-623a-11eb-9e7c-186571a04de3) (Territorial Divisions) sur geo.be : le GeoPackage en WGS 84 (EPSG:4326), type d'entité `judicialcanton`, révisé le 16 juillet 2026 |
| Licence       | © IGN, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)                                                                                                                                                                                           |
| Construit par | `scripts/parse/boundaries.ts` à partir de l'instantané du GeoPackage                                                                                                                                                                                       |
| Change quand  | L'IGN publie une nouvelle version : chaque année, quand les limites communales du SPF Finances sont mises à jour, ou quand une loi modifie l'annexe                                                                                                        |
| Couvre        | À partir du 21 octobre 2026, le jour où le fichier a été lu pour la première fois : une recherche pour un jour antérieur lève une `RangeError` ([temps](/fr/api#time))                                                                                     |
| Vérifié       | Deux fois par semaine, par le [workflow des sources](/fr/guide/data-quality#how-the-data-is-built) : le build échoue quand un canton n'a pas de limite ou qu'une limite ne correspond à aucun canton                                                       |

Comment l'IGN a tracé les limites, selon ses propres termes : là où l'annexe renvoie aux limites
communales, il a utilisé les limites cadastrales du SPF Finances ; là où elle renvoie à des cours
d'eau ou à des routes, les données topographiques propres de l'IGN ; là où elle renvoie à d'anciennes
communes, les limites de celles-ci selon l'IGN. L'échelle est 1:10 000.

## Champs {#fields}

| Champ                  | Type                   | Description                                                                                                                                                                            |
| ---------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `CantonId`             | L'identifiant du canton : un canton a une seule limite, qui prend sa clé                                                                                                               |
| `validFrom`, `validTo` | string?                | Les jours où l'enregistrement s'applique ; absents : depuis le début de la couverture, ou toujours en vigueur. Voyez [le temps](/fr/api#time)                                          |
| `canton`               | `CantonId`             | Le canton auquel la limite appartient                                                                                                                                                  |
| `ngiId`                | string                 | L'identifiant de l'objet chez l'IGN (son `tgid`), un GUID                                                                                                                              |
| `cantonCode`           | `{ nl, fr }`           | Le code du canton dans les données de l'IGN : six chiffres (`248112` pour Gand 1), avec un préfixe `N` ou `F` selon la langue à Bruxelles-Capitale et à Rhode-Saint-Genèse (`N238104`) |
| `geometry`             | `MultiPolygon`         | GeoJSON ([RFC 7946](https://www.rfc-editor.org/rfc/rfc7946)) : WGS 84, longitude d'abord, anneaux extérieurs dans le sens antihoraire, trous dans le sens horaire                      |
| `sources`              | `{ url, retrieved }[]` | Le fichier de l'IGN dont l'enregistrement a été lu                                                                                                                                     |

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

La géométrie est celle de l'IGN, sommet par sommet : rien n'est simplifié. Les coordonnées sont
arrondies à 7 décimales, soit environ un centimètre, en deçà de la précision de la source elle-même.
Chaque limite est un `MultiPolygon`, même quand elle n'a qu'un polygone, de sorte que tous les
enregistrements ont la même forme.

### Comment les cantons sont rattachés aux entités de l'IGN {#how-cantons-are-matched-to-the-ngi-s-features}

L'IGN nomme chaque entité en néerlandais et en français (`Eerste gerechtelijk kanton Gent`,
`Premier canton judiciaire de Gand`). Une entité est la limite d'un canton quand ses deux noms,
transformés en identifiant [de la manière habituelle](/fr/guide/identifiers), donnent ce canton et
s'accordent sur son numéro. Sept entités sont nommées par leur nom local dans les deux langues là où
l'annexe emploie un exonyme (`Canton judiciaire de Halle`, là où l'annexe dit `Hal` ;
`Gerechtelijk kanton Huy`, là où elle dit `Hoei`) ; celles-ci sont rattachées par leur code de canton
dans `CANTON_ALIASES` du parser. Tout le reste arrête le build.

## Taille {#size}

Les limites sont de loin le plus volumineux des jeux de données : environ un million de positions.
Elles ont leur propre point d'entrée, `belgica/canton-boundaries`, et la racine du package ne
les réexporte pas, si bien que rien ne les charge sans le demander :

<table v-if="stats.sizes">
<thead><tr><th>Point d'entrée</th><th style="text-align:right">JavaScript chargé</th><th style="text-align:right">gzip</th></tr></thead>
<tbody>
<tr v-for="s in stats.sizes.filter((s) => s.entry === 'belgica' || s.entry.endsWith('canton-boundaries'))" :key="s.entry">
<td><code>{{ s.entry }}</code></td><td style="text-align:right">{{ mb(s.raw) }}</td><td style="text-align:right">{{ mb(s.gzip) }}</td>
</tr>
</tbody>
</table>
<p v-else class="bld-muted">Les tailles sont mesurées à partir du build quand le site est construit (<code>pnpm build</code> d'abord).</p>

Le fichier brut, `data/canton-boundaries.json`, est dans le package npm et dans chaque release, de
sorte que Python, PostGIS et les outils SIG peuvent le lire sans le JavaScript.

## Trouver le canton d'un point {#finding-the-canton-of-a-point}

```ts
import { findCantonsAt, getCantonBoundary } from 'belgica/canton-boundaries'
import { getJusticeOfThePeace } from 'belgica/courts'

// Longitude d'abord, puis latitude, comme les ordonne GeoJSON
const [canton] = findCantonsAt(3.7268, 51.053) // Sint-Baafskathedraal, Gand → gent-1
getJusticeOfThePeace(canton.id).address // où déposer l'acte

findCantonsAt(2.3522, 48.8566) // [] : Paris, hors de Belgique
getCantonBoundary('gent-1').geometry // le MultiPolygon
```

`findCantonsAt` renvoie un canton pour un point en Belgique, aucun hors de celle-ci, et les deux
cantons pour un point exactement sur la ligne entre deux. Il ne requiert aucune dépendance : un
simple test point-dans-polygone sur les limites, environ une milliseconde par recherche. Géocoder
l'adresse (rue et numéro vers des coordonnées) vous revient : les registres d'adresses des régions
(Adressenregister de la Flandre, UrbIS de Bruxelles, ICAR de la Wallonie) et les données d'adresses
fédérales BeSt sur geo.be le font.

## Dans d'autres langages {#in-other-languages}

Le fichier est de la simple géométrie GeoJSON par enregistrement, si bien que n'importe quel SIG le
lit. En Python avec Shapely :

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
