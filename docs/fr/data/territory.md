<script setup>
import { judicialAreas, arrondissements, getJudicialArea, regions, provinces, getRegion } from '../../../src'
</script>

# Territoire et cantons {#territory-and-cantons}

La carte judiciaire belge compte trois niveaux : les **ressorts** (un par cour d'appel) contiennent des
**arrondissements**, qui contiennent des **cantons** (une justice de paix chacun). Les cantons sont
définis en termes de **communes**. À côté de la carte judiciaire, la carte administrative : chaque
commune se situe dans une **région** et, hors Bruxelles, dans une **province**.

## À quoi ça sert {#why-it-s-useful}

- **Quelle justice de paix ?** Les litiges locatifs, les petites créances, l'administration de la personne
  et des biens et les conflits de voisinage relèvent du juge de paix, en général celui du canton où le
  défendeur habite ou où se situe l'immeuble. Se tromper de canton, c'est introduire la demande devant le
  mauvais tribunal.
- **Quel arrondissement ?** Les tribunaux de première instance, de l'entreprise et du travail, le
  parquet et le territoire où un huissier de justice peut instrumenter sont tous organisés par
  arrondissement.
- **Quelle cour d'appel ?** L'appel se porte devant la cour d'appel du ressort.
- **Croiser des données.** Tout ce qui porte un code REFNIS (statistiques de Statbel, données ouvertes
  régionales, registres d'adresses) peut être placé sur la carte judiciaire.

La loi décrit les cantons en prose (« la partie du territoire de la ville d'Anvers délimitée par l'axe du
Brouwersvliet… »). Ces fichiers en font des données tout en conservant le texte légal pour les cas où seul
le texte peut trancher.

## Source et mises à jour {#source-and-updates}

|               |                                                                                                                                                                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source        | Annexe au Code judiciaire, « Gebiedsomschrijving en zetel van hoven en rechtbanken » / « Délimitation du territoire et siège des cours et tribunaux » ([ELI, numac 1967101058](https://www.ejustice.just.fgov.be/eli/wet/1967/10/10/1967101058/justel)), en néerlandais et en français ; données ouvertes de Statbel pour les communes, les provinces et les régions |
| Construit par | `pnpm build:cantons` (cantons, communes) ; instantanés + `pnpm build:data` (régions, provinces) ; à la main (ressorts, arrondissements)                                                                                                                                                                                                                              |
| Change quand  | Une loi modifie l'annexe ; des communes fusionnent (2019, 2025)                                                                                                                                                                                                                                                                                                      |
| Couvre        | À partir du 1er janvier 2025 : une recherche pour une date antérieure lève une `RangeError` ([temps](/fr/api#time))                                                                                                                                                                                                                                                  |
| Vérifié       | Reconstruit à la main avec `pnpm build:cantons` : ejustice refuse les serveurs de GitHub ([qualité des données](/fr/guide/data-quality))                                                                                                                                                                                                                             |
| Licence       | CC BY 4.0 ; données communales © Statbel, CC BY 4.0                                                                                                                                                                                                                                                                                                                  |

## Trouver le canton d'une commune {#find-the-canton-for-a-municipality}

<CantonLookup />

## Ressorts {#judicial-areas}

Les 5 ressorts des cours d'appel (rechtsgebieden). Fichier : `data/judicial-areas.json`.
Source : annexe au Code judiciaire (C. jud.), art. 5.

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

## Arrondissements {#arrondissements}

Les 12 arrondissements judiciaires. Fichier : `data/arrondissements.json`. Source : annexe au
C. jud., art. 4.

<table>
<thead><tr><th>Id</th><th>nl</th><th>fr</th><th>de</th><th>Ressort</th></tr></thead>
<tbody>
<tr v-for="a in arrondissements" :key="a.id">
<td><code>{{ a.id }}</code></td><td>{{ a.name.nl }}</td><td>{{ a.name.fr }}</td><td>{{ a.name.de }}</td>
<td>{{ getJudicialArea(a.judicialArea)?.name.fr }}</td>
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

## Cantons {#cantons}

Les 162 cantons judiciaires : le territoire d'une justice de paix chacun. Fichier : `data/cantons.json`
(généré à partir de l'annexe au Code judiciaire, art. 1er).

### Champs {#fields}

| Champ            | Type                           | Description                                                                                                                |
| ---------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `CantonId`                     | Identifiant stable dans la langue locale, numéroté là où il y a plusieurs cantons : `gent-1`, `merelbeke-melle`, `wavre-1` |
| `arrondissement` | string                         | Identifiant de l'arrondissement                                                                                            |
| `name`           | `{ nl, fr, de? }`              | Nom du canton tel que l'annexe le donne ; `de` seulement là où un texte officiel allemand nomme le canton                  |
| `number`         | number?                        | Numéro du canton là où il y en a plusieurs (Gent 1–5)                                                                      |
| `seat`           | `{ nl, fr }`                   | Siège de la justice de paix ; peut différer du nom                                                                         |
| `municipalities` | `{ municipality, partial? }[]` | Communes couvertes, par code REFNIS ; `partial: true` quand seule une partie l'est                                         |
| `territory`      | `{ nl, fr }`                   | Le territoire du canton, tel quel dans l'annexe                                                                            |
| `legalBasis`     | `{ url, provision }`           | Où la loi le définit : l'ELI de l'annexe et la section, p. ex. `Bijvoegsel art. 1, afdeling 6.15` (Gent 4)                 |
| `sources`        | `{ url, retrieved }[]`?        | Le texte officiel allemand dont provient le nom allemand                                                                   |

```ts
interface Canton {
    id: CantonId // 'gent-1', 'merelbeke-melle'
    arrondissement: ArrondissementId
    name: Bilingual & { de?: string } // généralement le siège, mais pas toujours
    number?: number // pour les lieux à plusieurs cantons (Gent 1–5, …)
    seat: Bilingual // le siège de la justice de paix
    municipalities: { municipality: MunicipalityId; partial?: boolean }[]
    territory: Bilingual // le territoire du canton, tel quel dans l'annexe
    legalBasis: { url: string; provision: string } // l'ELI de l'annexe, et la section
    sources?: SourceRef[] // le texte officiel allemand, pour un canton avec un nom allemand
}
```

- **Les identifiants** suivent la langue locale : le néerlandais en Flandre et à Bruxelles, le français en
  Wallonie, l'allemand autour d'Eupen ; Bruxelles, bilingue, prend le nom néerlandais. Voyez
  [Identifiants](/fr/guide/identifiers). La justice de paix renvoie à son canton par son champ `canton`.
- **Le nom et le siège peuvent différer** : le canton `oudergem` siège à Etterbeek.
- **`partial: true`** marque une commune scindée entre plusieurs cantons. Le texte `territory` précise
  alors quelle partie (rues, numéros, cours d'eau) relève de ce canton.
- **Noms allemands** seulement là où un texte officiel allemand nomme le canton : l'annexe n'a pas de
  traduction allemande. Aujourd'hui, ce sont les deux cantons d'Eupen-Saint-Vith, d'après la
  traduction allemande de l'arrêté ministériel du 31 octobre 2023 (Moniteur belge du 18 juillet
  2024), qui nomme le second ; le premier est aussi nommé sur la page allemande de son tribunal sur
  le portail des cours et tribunaux. Les deux figurent dans `sources`. Aucun nom n'est traduit à la
  main.

### Communes scindées {#split-municipalities}

55 cantons ne couvrent qu'une partie d'une commune. Pour ceux-ci, le canton ne peut se déduire de la seule
commune : il dépend de la rue (et parfois du numéro de maison). Le texte `territory` en nomme les
limites. Avec les coordonnées de l'adresse, `findCantonsAt(lon, lat)`, de
`belgica/canton-boundaries`, trouve le canton dans les
[limites des cantons](./canton-boundaries) de l'IGN ; sans elles, affichez les cantons candidats et leur
texte, et laissez une personne trancher. Là où la géométrie et le texte divergent, le texte fait loi.

## Communes {#municipalities}

Les 565 communes avec leur code REFNIS (NIS) de Statbel. Fichier : `data/municipalities.json`
(généré à partir de Statbel). © Statbel, CC BY 4.0.

```ts
interface Municipality {
    id: MunicipalityId // le code REFNIS : '44021' pour Gent
    name: Bilingual
    province: ProvinceId | '04000' // code REFNIS de la province ; '04000' à Bruxelles
    region: RegionId // code REFNIS de la région
}
```

Les 19 communes de la Région de Bruxelles-Capitale n'ont pas de province. Leur `province` vaut
`04000`, le code de la région : c'est ce que Statbel met lui-même dans la colonne province de ses
fichiers. `getProvinceForMunicipality` renvoie `undefined` pour elles ; `getRegionForMunicipality`
donne la région. Les codes sont listés ci-dessous, à partir des données.

## Régions {#regions}

Les 3 régions. Fichier : `data/regions.json` (généré à partir de la liste des codes REFNIS de
Statbel ; noms tels que Statbel les publie). © Statbel, CC BY 4.0.

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
    id: RegionId // le code REFNIS : '02000', '03000', '04000'
    name: Translated // { nl, fr, de }, tels que Statbel les publie
    sources: SourceRef[] // la liste des codes REFNIS de Statbel
}
```

## Provinces {#provinces}

Les 10 provinces, avec leur région. Fichier : `data/provinces.json` (généré à partir de la liste
des codes REFNIS de Statbel). © Statbel, CC BY 4.0. La Région de Bruxelles-Capitale n'a pas de
province ; la province de Brabant, qui a cessé d'exister le 31 décembre 1994, est antérieure à la
couverture des données.

<table>
<thead><tr><th>Id (REFNIS)</th><th>nl</th><th>fr</th><th>de</th><th>Région</th></tr></thead>
<tbody>
<tr v-for="p in provinces" :key="p.id">
<td><code>{{ p.id }}</code></td><td>{{ p.name.nl }}</td><td>{{ p.name.fr }}</td><td>{{ p.name.de }}</td>
<td>{{ getRegion(p.region).name.fr }}</td>
</tr>
</tbody>
</table>

```ts
interface Province {
    id: ProvinceId // le code REFNIS : '40000' pour la Flandre orientale
    name: Translated // { nl, fr, de }, tels que Statbel les publie
    region: RegionId
    sources: SourceRef[] // la liste des codes REFNIS de Statbel
}
```

Les noms sont ceux de Statbel, avec le mot désignant le type d'entité (`Provincie
Oost-Vlaanderen`, `Province de Flandre orientale`, `Provinz Ostflandern`) : le paquet conserve les
valeurs telles que la source les publie et ne les abrège pas.
